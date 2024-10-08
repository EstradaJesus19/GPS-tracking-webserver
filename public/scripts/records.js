let map; 
let polyline;
let path = [];
let polylines = [];
let markers = [];
let circle = null;
let isSelectingLocation = false;
let selectedPosition = null;
let radius = null;

// Get server owner and print it in the web page tittle
fetch('/api/getOwner')
    .then(response => response.json())
    .then(data => {
        document.title = `Records - ${data.owner}`;
    })
    .catch(error => console.error('Error fetching owner:', error));

// Load Google Maps API
function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=maps,marker&v=beta`;
    script.async = true;
    document.head.appendChild(script);
}

// Get APIKEY and load map API
fetch('/api/getApiKey')
    .then(response => response.json())
    .then(data => {
        loadGoogleMapsApi(data.apiKey);
    })
    .catch(error => {
        console.error('Error getting API Key:', error);
    });

// Init map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false
    });

    // Define polyline features
    polyline = new google.maps.Polyline({
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        icons: [{
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: '#6309CE',
                strokeWeight: 2,
                fillColor: '#6309CE',
                fillOpacity: 1.0,
            },
            offset: '100%',
            repeat: '100px'
        }]
    });

    polyline.setMap(map);
}

//Filtering by time
// Link calendars and dates
document.addEventListener('DOMContentLoaded', function () {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    function getMaxDate() {
        return new Date();
    }

    // Set start time calendar
    const startFlatpickr = flatpickr(startInput, {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        time_24hr: true,
        maxDate: getMaxDate(),
        onOpen: function() {
            this.set('maxDate', getMaxDate());
        },
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                endFlatpickr.set('minDate', selectedDate);
                endFlatpickr.set('maxDate', getMaxDate());
                validateTime(startFlatpickr, endFlatpickr); 
            }
        }
    });

    // Set end time calendar
    const endFlatpickr = flatpickr(endInput, {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        time_24hr: true,
        maxDate: getMaxDate(),
        onOpen: function() {
            this.set('maxDate', getMaxDate());
        },
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                startFlatpickr.set('maxDate', selectedDate);
                validateTime(startFlatpickr, endFlatpickr); 
            }
        }
    });
    
    // Compare start and end date/time
    function validateTime(startPicker, endPicker) {
        const startDate = startPicker.selectedDates[0];
        const endDate = endPicker.selectedDates[0];

        if (startDate && endDate && startDate.toDateString() === endDate.toDateString()) {
            const startTime = startDate.getTime();
            const endTime = endDate.getTime();

            if (startTime >= endTime) {
                endPicker.setDate(startDate);
            }
        }
    }
});

// Filter by time
document.getElementById('timeFilterBtn').addEventListener('click', function (e) {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    e.preventDefault();

    // Message if time frame not selected
    if (!startInput.value || !endInput.value) {
        Swal.fire({
            text: 'Please set a time frame',
            icon: 'error',
            iconColor: '#6309CE',
            confirmButtonText: 'Accept',
            confirmButtonColor: '#6309CE',
            customClass: {
                popup: 'swal2-custom-font',
                icon: 'swal2-icon-info-custom'
            }
        });
        return;
    }

    clearMap();
    path = [];

    const startTime = convertToDatabaseFormat(startInput.value);
    const endTime = convertToDatabaseFormat(endInput.value);

    // Request time filtered data to server
    fetch(`/api/filterData?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
        .then(response => response.json())
        .then(data => {
            
            // Process data and update map
            if (data.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                let paths = [];
                let currentPath = [];
                let previousTime = null;
                let lastPoint = null;
                let startTimePath = null;
                let endTimePath = null;

                // Separate data in paths
                data.forEach(point => {
                    const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };

                    const currentTimeString = `${point.date.split('T')[0]}T${point.time}`;
                    const currentTime = new Date(currentTimeString);

                    // Inicialize comparation variables
                    let timeDifference = 0;
                    let distance = 0;

                    if (previousTime) {
                        timeDifference = (currentTime - previousTime) / 1000; 
                    }

                    if (lastPoint) {
                        distance = google.maps.geometry.spherical.computeDistanceBetween(
                            new google.maps.LatLng(lastPoint.lat, lastPoint.lng),
                            new google.maps.LatLng(latLng.lat, latLng.lng)
                        );
                    }

                    // Crate new path if time differences > 60 or distance > 1000
                    if (timeDifference > 60 || distance > 1000) {
                        if (currentPath.length > 0) {
                            paths.push({ path: currentPath, startTimePath: startTimePath, endTimePath: endTimePath });
                        }
                        currentPath = [];
                    }

                    if (!currentPath.length) {
                        startTimePath = currentTime; 
                    }

                    endTimePath = currentTime; 
                    previousTime = currentTime; 
                    currentPath.push(latLng); 
                    bounds.extend(latLng); 
                    lastPoint = latLng;         
                });

                // Add data to paths
                if (currentPath.length > 0) {
                    paths.push({ path: currentPath, startTimePath: startTimePath, endTimePath: endTimePath });
                }

                // Print polylines
                paths.forEach((path, index) => {
                    const polyline = new google.maps.Polyline({
                        path: paths[index].path,
                        strokeColor: '#6309CE',
                        strokeOpacity: 1.0,
                        strokeWeight: 5,
                        icons: [{
                            icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 3,
                                strokeColor: '#6309CE',
                                strokeWeight: 2,
                                fillColor: '#6309CE',
                                fillOpacity: 1.0,
                            },
                            offset: '100%',
                            repeat: '100px'
                        }]
                    });

                    polyline.setMap(map);
                    polylines.push(polyline);

                    markers.push(new google.maps.Marker({
                        position: paths[index].path[0], 
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 5,
                            fillColor: "#C3AAff",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#6309CE"
                        },
                        title: `Start of Path ${index + 1}`
                    }));

                    markers.push(new google.maps.Marker({
                        position: paths[index].path[path.length - 1], 
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 5,
                            fillColor: "#C3AAff",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#6309CE"
                        },
                        title: `End of Path ${index + 1}`
                    }));
                });

                map.fitBounds(bounds);
                enableMapClick();

            } else {
                // Print warning if no data was found
                Swal.fire({
                    text: 'No data found in the specified time frame.',
                    icon: 'info',
                    iconColor: '#6309CE',
                    confirmButtonText: 'Accept',
                    confirmButtonColor: '#6309CE',
                    customClass: {
                        popup: 'swal2-custom-font',
                        icon: 'swal2-icon-info-custom'
                    }
                });
            }
        })
        .catch(error => {
            clearMap();
            
            // Print warning if error filtering data
            Swal.fire({
                text: 'Error getting filtered data: ' + error,
                icon: 'error',
                iconColor: '#6309CE',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#6309CE',
                customClass: {
                    popup: 'swal2-custom-font',
                    icon: 'swal2-icon-info-custom'
                }
            });
            console.error('Error getting filtered data: ', error);
        });

    // Enable map click
    function enableMapClick() {
        map.addListener('click', handleMapClick);
        map.setOptions({ draggableCursor: 'crosshair' });
    }

    // Disable map click
    function disableMapClick() {
        google.maps.event.clearListeners(map, 'click');
    }

    // Manage clicking on map
    function handleMapClick(event) {
        selectedPosition = event.latLng;
        clearCircles();
        radius = 500;
        drawCircle(selectedPosition, radius, true);
        filterByPosition(radius, selectedPosition, startTime, endTime);
    }

    let isDragging = false;

    // Draw circle on map
    function drawCircle(position, radius, isEditable) {
        circle = new google.maps.Circle({
            center: position,
            radius: radius,
            strokeColor: '#6309CE',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: '#C3AAff',
            fillOpacity: 0.25,
            map: map,
            editable: isEditable,
            draggable: isEditable
        });

        if (isEditable) {
            google.maps.event.addListener(circle, 'radius_changed', function () {
                radius = Math.round(circle.getRadius());
                filterByPosition(radius, selectedPosition, startTime, endTime);
            });


            // Handle the 'mouseup' event to execute filterByPosition only when the click is released
            google.maps.event.addListener(circle, 'mouseup', function () {
                radius = Math.round(circle.getRadius());
                selectedPosition = circle.getCenter();
                filterByPosition(radius, selectedPosition, startTime, endTime);
            });
        }
    }
});

function filterByPosition(radius, selectedPosition, startTime, endTime){
    // Print warning if position or radius aren't selected
    if (!selectedPosition || !radius) {
        Swal.fire({
            text: 'Please set a location and define a radius',
            icon: 'error',
            iconColor: '#6309CE',
            confirmButtonText: 'Accept',
            confirmButtonColor: '#6309CE',
            customClass: {
                popup: 'swal2-custom-font',
                icon: 'swal2-icon-info-custom'
            }
        });
        return;
    }

    const position = {
        latitude: selectedPosition.lat(),
        longitude: selectedPosition.lng(),
        radius: radius
    };

    // Request position filtered data to server
    fetch(`/api/filterDataByPosition?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&latitude=${position.latitude}&longitude=${position.longitude}&radius=${position.radius}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                let paths = []; 
                let currentPath = []; 
                let previousTime = null; 
                let startTimePath = null;
                let endTimePath = null;

                // Check received data
                data.forEach((point, index) => {
                    const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };

                    const currentTimeString = `${point.date.split('T')[0]}T${point.time}`; 
                    const currentTime = new Date(currentTimeString);
                    
                    // Compare time between data
                    if (previousTime) {
                        const timeDifference = (currentTime - previousTime) / 1000; 

                        if (timeDifference > 60) {
                            if (currentPath.length > 0) {
                                paths.push({ path: currentPath, startTimePath: startTimePath, endTimePath: endTimePath }); 
                            }
                            currentPath = []; 
                        }
                    }

                    if (!currentPath.length) {
                        startTimePath = currentTime; 
                    }
                    endTimePath = currentTime; 
                    currentPath.push(latLng); 
                    bounds.extend(latLng); 
                    previousTime = currentTime; 
                });

                if (currentPath.length > 0) {
                    paths.push({ path: currentPath, startTimePath: startTimePath, endTimePath: endTimePath });
                }
                
                // Create windows for path selecting
                createPathSelector(paths);
                selectPath(0, paths);

                // map.fitBounds(bounds);

            } else {
                clearPolylines();
                clearMarkers();

                // Print warning that no data was found
                Swal.fire({
                    text: 'No data found in the specified area.',
                    icon: 'info',
                    iconColor: '#6309CE',
                    confirmButtonText: 'Accept',
                    confirmButtonColor: '#6309CE',
                    customClass: {
                        popup: 'swal2-custom-font',
                        icon: 'swal2-icon-info-custom'
                    }
                });
            }
        })
        .catch(error => {
            clearPolylines();
            clearMarkers();

            // Print warning if error filtering data
            Swal.fire({
                text: 'Error fetching filtered data: ' + error,
                icon: 'error',
                iconColor: '#6309CE',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#6309CE',
                customClass: {
                    popup: 'swal2-custom-font',
                    icon: 'swal2-icon-info-custom'
                }
            });
            console.error('Error fetching filtered data: ', error);
        });
}

// Convert date and time into database format
function convertToDatabaseFormat(dateTimeStr) {
    const [day, month, yearTime] = dateTimeStr.split('-');
    const [year, time] = yearTime.split(' ');
    return `${year}-${month}-${day} ${time}`;
}

// Create path selector
function createPathSelector(paths) {
    const pathSelectorContainer = document.getElementById('pathSelector');
    const pathButtonsContainer = document.getElementById('pathButtons');
    pathButtonsContainer.innerHTML = ''; 

    if (paths.length === 0) {
        pathSelectorContainer.style.display = 'none';
        return;
    }
    pathSelectorContainer.style.display = 'block'; 

    paths.forEach((pathInfo, index) => {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex'; 
        buttonContainer.style.alignItems = 'center';

        const button = document.createElement('button');
        button.className = 'pathButton';
        button.id = `pathButton-${index}`;
        button.innerText = `Path ${index + 1}`;
        button.onclick = () => selectPath(index, paths);

        // Format date and time for UX
        const startDate = new Date(pathInfo.startTimePath);
        const endDate = new Date(pathInfo.endTimePath);

        function formatDateAndTime(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = date.getDate();
            const month = months[date.getMonth()]; 
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0'); 
            const minutes = date.getMinutes().toString().padStart(2, '0'); 

            return `${day} ${month} ${year} at ${hours}:${minutes}`;
        }

        const startTimeFormatted = formatDateAndTime(startDate);
        const endTimeFormatted = formatDateAndTime(endDate);

        const timeText = document.createElement('span');
        timeText.innerText = `: ${startTimeFormatted} to ${endTimeFormatted}`;
        timeText.style.marginLeft = '5px'; 

        buttonContainer.appendChild(button);
        // buttonContainer.appendChild(timeText);
        pathButtonsContainer.appendChild(buttonContainer);
    });
}

// Set selected or not selected button class
function SelectButtonOrNo(index) {
    const allButtons = document.querySelectorAll('#pathButtons .pathButton');
    allButtons.forEach(button => button.classList.remove('selected'));

    const selectedButton = document.getElementById(`pathButton-${index}`);
    selectedButton.classList.add('selected');
}

// Select path
function selectPath(index, paths) {
    SelectButtonOrNo(index); 
    clearPolylines();
    clearMarkers(); 

    const polyline = new google.maps.Polyline({
        path: paths[index].path,
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        icons: [{
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: '#6309CE',
                strokeWeight: 2,
                fillColor: '#6309CE',
                fillOpacity: 1.0,
            },
            offset: '100%',
            repeat: '100px'
        }]
    });

    polyline.setMap(map); 
    polylines.push(polyline);

    markers.push(new google.maps.Marker({
        position: paths[index].path[0],
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: "#C3AAff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#6309CE"
        },
        title: `Start of path ${index + 1}`
    }));

    markers.push(new google.maps.Marker({
        position: paths[index].path[paths[index].path.length - 1],
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: "#C3AAff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#6309CE"
        },
        title: `End of path ${index + 1}`
    }));
}

// Clear map
function clearMap() {
    clearCircles();
    clearMarkers();
    clearPolylines();
}

// Clear markers
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// Clear circles
function clearCircles() {
    if (circle) {
        circle.setMap(null);
        circle = null;
    }
}

// Clear polylines
function clearPolylines() {
    polylines.forEach(polyline => {
         polyline.setMap(null);
    });
    polylines = [];
}

//Filtering by position
// document.addEventListener('DOMContentLoaded', function () {
//     const selectLocationBtn = document.getElementById('selectLocationBtn');
//     const selectLocationContainer = document.getElementById('selectLocationContainer');
//     const positionFilterBtn = document.getElementById('positionFilterBtn');
//     const radiusInput = document.getElementById('radiusInput');
//     const pathSelectorContainer = document.getElementById('pathSelector');

//     // Define select location button actions
//     selectLocationBtn.addEventListener('click', function () {
//         if (!isSelectingLocation) {
//             clearMap();
//             radiusInput.disabled = false;
//             pathSelectorContainer.style.display = 'none';
//             isSelectingLocation = true;
//             selectedPosition = null;
//             positionFilterBtn.style.opacity = 0.5;
//             positionFilterBtn.style.cursor = 'not-allowed';
//             positionFilterBtn.disabled = true;

//             selectLocationBtn.style.display = 'none'; 
//             createLocationButtons();

//             enableMapClick();
//             map.setOptions({ draggableCursor: 'crosshair' });
//         }
//     });

//     // Create confirm and cancel buttons
//     function createLocationButtons() {
//         const buttonContainer = document.createElement('div');
//         buttonContainer.id = 'locationButtons';
//         buttonContainer.style.display = 'inline';
//         buttonContainer.style.gap = '10px';
//         buttonContainer.style.justifyContent = 'center';

//         const checkBtn = document.createElement('button');
//         checkBtn.innerHTML = '<img src="media/check.svg" alt="Check">';
//         checkBtn.style.backgroundColor = '#ffffff';
//         checkBtn.style.border = '2px solid #6309CE';
//         checkBtn.style.borderRadius = '50%';
//         checkBtn.style.width = '40px';
//         checkBtn.style.height = '40px';
//         checkBtn.style.cursor = 'pointer';
//         checkBtn.style.marginRight = '10px';
//         checkBtn.style.padding = '5px';

//         // Confirm selected location
//         checkBtn.addEventListener('click', function () {
//             if (selectedPosition) {
//                 circle.setEditable(false);
//                 circle.setDraggable(false);
//                 isSelectingLocation = false;

//                 clearLocationButtons(); 
//                 selectLocationBtn.style.display = 'inline'; 

//                 positionFilterBtn.style.opacity = 1;
//                 positionFilterBtn.style.cursor = 'pointer';
//                 positionFilterBtn.disabled = false;

//                 map.setOptions({ draggableCursor: null });
//                 disableMapClick();

//                 // Creater center marker in the area circle
//                 markers.push(new google.maps.Marker({
//                     position: selectedPosition,
//                     map: map,
//                     icon: {
//                         path: google.maps.SymbolPath.CIRCLE,
//                         scale: 5,
//                         fillColor: "#C3AAff",
//                         fillOpacity: 1,
//                         strokeWeight: 2,
//                         strokeColor: "#6309CE"
//                     },
//                     title: "Center"
//                 }));
                
//             } else {
//                 // Print warning whrn position is not set
//                 Swal.fire({
//                     text: 'Set a location on the map',
//                     icon: 'error',
//                     iconColor: '#6309CE',
//                     confirmButtonText: 'Accept',
//                     confirmButtonColor: '#6309CE',
//                     customClass: {
//                         popup: 'swal2-custom-font',
//                         icon: 'swal2-icon-info-custom'
//                     }
//                 });
//             }
//         });

//         const cancelBtn = document.createElement('button');
//         cancelBtn.innerHTML = '<img src="media/cancel.svg" alt="Cancel">';
//         cancelBtn.style.backgroundColor = '#ffffff';
//         cancelBtn.style.border = '2px solid #6309CE';
//         cancelBtn.style.borderRadius = '50%';
//         cancelBtn.style.width = '40px';
//         cancelBtn.style.height = '40px';
//         cancelBtn.style.cursor = 'pointer';
//         cancelBtn.style.marginRight = '10px';
//         cancelBtn.style.padding = '5px';

//         // Cancel selected location
//         cancelBtn.addEventListener('click', function () {
//             clearLocationButtons();
//             selectLocationBtn.style.display = 'inline'; 

//             clearMap();
//             map.setOptions({ draggableCursor: null });
//             disableMapClick();
//             isSelectingLocation = false;
//             selectedPosition = null;

//             positionFilterBtn.style.opacity = 1;
//             positionFilterBtn.style.cursor = 'pointer';
//             positionFilterBtn.disabled = false;
//         });

//         // Set buttons in web page
//         buttonContainer.appendChild(checkBtn);
//         buttonContainer.appendChild(cancelBtn);
//         selectLocationContainer.appendChild(buttonContainer);
//     }

//     // Remove location buttons
//     function clearLocationButtons() {
//         const buttonContainer = document.getElementById('locationButtons');
//         if (buttonContainer) {
//             buttonContainer.remove();
//         }
//     }

//     // Link radius input with map circle
//     radiusInput.addEventListener('input', function () {
//         if (circle) {
//             const newRadius = parseFloat(radiusInput.value);
//             circle.setRadius(newRadius);
//         }
//     });

//     // Enable map click
//     function enableMapClick() {
//         map.addListener('click', handleMapClick);
//     }

//     // Disable map click
//     function disableMapClick() {
//         google.maps.event.clearListeners(map, 'click');
//     }

//     // Manage clicking on map
//     function handleMapClick(event) {
//         selectedPosition = event.latLng;
//         clearMap();
//         drawCircle(selectedPosition, parseFloat(radiusInput.value), true);
//     }

//     // Draw circle on map
//     function drawCircle(position, radius, isEditable) {
//         clearMap();

//         circle = new google.maps.Circle({
//             center: position,
//             radius: radius,
//             strokeColor: '#6309CE',
//             strokeOpacity: 0.5,
//             strokeWeight: 2,
//             fillColor: '#C3AAff',
//             fillOpacity: 0.25,
//             map: map,
//             editable: isEditable,
//             draggable: isEditable
//         });

//         if (isEditable) {
//             // Update radius input with edited on map values 
//             circle.addListener('radius_changed', function () {
//                 const updatedRadius = Math.round(circle.getRadius());
//                 document.getElementById('radiusInput').value = updatedRadius;
//             });

//             // Change selected position with new center
//             circle.addListener('center_changed', function () {
//                 selectedPosition = circle.getCenter();
//             });
//         }
//     }
// });



// // Filter by position
// document.getElementById('positionFilterBtn').addEventListener('click', function (e) { 
//     const radiusInput = document.getElementById('radiusInput');

//     e.preventDefault();

//     // Print warning if position or radius aren't selected
//     if (!selectedPosition || !radiusInput.value) {
//         Swal.fire({
//             text: 'Please set a location and define a radius',
//             icon: 'error',
//             iconColor: '#6309CE',
//             confirmButtonText: 'Accept',
//             confirmButtonColor: '#6309CE',
//             customClass: {
//                 popup: 'swal2-custom-font',
//                 icon: 'swal2-icon-info-custom'
//             }
//         });
//         return;
//     }

//     const position = {
//         latitude: selectedPosition.lat(),
//         longitude: selectedPosition.lng(),
//         radius: parseFloat(radiusInput.value)
//     };

//     radiusInput.disabled = true;

//     // Request position filtered data to server
//     fetch(`/api/filterDataByPosition?latitude=${position.latitude}&longitude=${position.longitude}&radius=${position.radius}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data.length > 0) {
//                 const bounds = new google.maps.LatLngBounds();
//                 let paths = []; 
//                 let currentPath = []; 
//                 let previousTime = null; 
//                 let startTime = null;
//                 let endTime = null;

//                 // Check recieved data
//                 data.forEach((point, index) => {
//                     const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };

//                     const currentTimeString = `${point.date.split('T')[0]}T${point.time}`; 
//                     const currentTime = new Date(currentTimeString);
                    
//                     // Compare time between data
//                     if (previousTime) {
//                         const timeDifference = (currentTime - previousTime) / 1000; 

//                         if (timeDifference > 60) {
//                             if (currentPath.length > 0) {
//                                 paths.push({ path: currentPath, startTime: startTime, endTime: endTime }); 
//                             }
//                             currentPath = []; 
//                         }
//                     }

//                     if (!currentPath.length) {
//                         startTime = currentTime; 
//                     }
//                     endTime = currentTime; 
//                     currentPath.push(latLng); 
//                     bounds.extend(latLng); 
//                     previousTime = currentTime; 
//                 });

//                 if (currentPath.length > 0) {
//                     paths.push({ path: currentPath, startTime: startTime, endTime: endTime });
//                 }
                
//                 // Create windows for path selecting
//                 createPathSelector(paths);
//                 selectPath(0, paths);
//                 map.fitBounds(bounds);

//                 if (paths.length > 1){
//                     // Tell user that more than one path was found
//                     Swal.fire({
//                         text: 'More than one path found. Select a path to view in the lower window.',
//                         confirmButtonText: 'Accept',
//                         confirmButtonColor: '#6309CE',
//                         customClass: {
//                             popup: 'swal2-custom-font',
//                         }
//                     });
//                 }
//             } else {
//                 // Print warning that no data was found
//                 Swal.fire({
//                     text: 'No data found in the specified area.',
//                     icon: 'info',
//                     iconColor: '#6309CE',
//                     confirmButtonText: 'Accept',
//                     confirmButtonColor: '#6309CE',
//                     customClass: {
//                         popup: 'swal2-custom-font',
//                         icon: 'swal2-icon-info-custom'
//                     }
//                 });
//             }
//         })
//         .catch(error => {
//             clearMap();

//             // Print warning if error filtering data
//             Swal.fire({
//                 text: 'Error fetching filtered data: ' + error,
//                 icon: 'error',
//                 iconColor: '#6309CE',
//                 confirmButtonText: 'Accept',
//                 confirmButtonColor: '#6309CE',
//                 customClass: {
//                     popup: 'swal2-custom-font',
//                     icon: 'swal2-icon-info-custom'
//                 }
//             });
//             console.error('Error fetching filtered data: ', error);
//         });
// });


