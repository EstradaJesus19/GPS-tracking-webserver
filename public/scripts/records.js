import { getApiOwner, getApiKey, map, polyline } from "./records-scripts/init.js";

// Define variables

let polylines = [];
let path = [];
let paths = [];
let usedPaths = [];
let selectedPath = [];
let markers = [];
let circle = null;
let isSelectingLocation = false;
let positionFiltering = false;
let selectedPosition = null;
let radius = null;
let startTime = null;
let endTime = null;
let positionOptionsVisible = true;
let pathOptionsVisible = true;
let currentPathIndex = 0;
let currentPointIndex = 0;
let isPlaying = false;  
let playIntervalId = null;
let currentVelocity = 200; 

const mapElement = document.getElementById('map');
const startInput = document.getElementById('startDateTime');
const endInput = document.getElementById('endDateTime');
const timeFilterBtn = document.getElementById('timeFilterBtn');
const pathSelectorContainer = document.getElementById('pathSelector');
const positionControl = document.getElementById('positionControl');
const pathButtonsContainer = document.getElementById('pathButtons');
const radiusInput = document.getElementById('radiusInput');
const latitudeInput = document.getElementById('latitudeInput');
const longitudeInput = document.getElementById('longitudeInput');
const toggleSwitch = document.getElementById('toggleSwitch');
const positionOptions = document.getElementById('positionOptions');
const hiderPosition = document.getElementById('hiderPosition');
const hiderContainerPosition = document.getElementById('hiderContainerPosition');
const infoBox = document.getElementById('infoBox');
const hiderPath = document.getElementById('hiderPath');
const pathOptions = document.getElementById('pathOptions');
const pointDate = document.getElementById('pointDate');
const pointTime = document.getElementById('pointTime');
const previousPoint = document.getElementById('previousPoint');
const nextPoint = document.getElementById('nextPoint');
const playPoint = document.getElementById('playPoint');
const velocityPoint = document.getElementById('velocityPoint')
const velocityDisplay = document.getElementById('velocity');
const playOption = document.getElementById('play');

getApiOwner();
getApiKey();

//Filtering by time
// Link calendars and dates
document.addEventListener('DOMContentLoaded', function () {
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
timeFilterBtn.addEventListener('click', function (e) {

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
    paths = [];

    pathSelectorContainer.style.display = 'none';
    positionControl.style.display = 'block';


    startTime = convertToDatabaseFormat(startInput.value);
    endTime = convertToDatabaseFormat(endInput.value);

    // Request time filtered data to server
    fetch(`/api/filterDataByTime?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
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
});

// Enable map click
function enableMapClick() {
    map.addListener('click', handleMapClick);
    map.setOptions({ draggableCursor: 'crosshair' });
}

// Disable map click
function disableMapClick() {
    google.maps.event.clearListeners(map, 'click');
    map.setOptions({ draggableCursor: 'null' });
}

// Manage clicking on map
function handleMapClick(event) {
    radius = parseFloat(radiusInput.value);
    selectedPosition = event.latLng;
    latitudeInput.value = selectedPosition.lat().toFixed(4);
    longitudeInput.value = selectedPosition.lng().toFixed(4);
    clearCircles();
    drawCircle(selectedPosition, radius, true);
    filterByPosition(radius, selectedPosition, startTime, endTime);
}

// Link radius input with map circle
radiusInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        if (circle) {
            if (radiusInput.value <=500){
                radiusInput.value = 500;
            }
            radius = parseFloat(radiusInput.value);
            circle.setRadius(radius);
        }
        
    }
});

radiusInput.addEventListener('change', function () {
    if (circle) {
        radius = parseFloat(radiusInput.value);
        circle.setRadius(radius);
    }
});

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
        draggable: isEditable,
    });

    if (isEditable) {
        google.maps.event.addListener(circle, 'radius_changed', function () {
            radius = Math.round(circle.getRadius());
            filterByPosition(radius, selectedPosition, startTime, endTime);
            radiusInput.value = radius;
        });
        
        google.maps.event.addListener(circle, 'mouseup', function () {
            selectedPosition = circle.getCenter();
            filterByPosition(radius, selectedPosition, startTime, endTime);
            latitudeInput.value = selectedPosition.lat().toFixed(4);
            longitudeInput.value = selectedPosition.lng().toFixed(4);
        });
    }
}

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
                let currentMetadata = [];
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
                                paths.push({ path: currentPath, metadata: currentMetadata, startTimePath: startTimePath, endTimePath: endTimePath }); 
                            }
                            currentPath = []; 
                            currentMetadata = [];
                        }
                    }

                    if (!currentPath.length) {
                        startTimePath = currentTime; 
                    }
                    endTimePath = currentTime; 
                    currentPath.push(latLng); 
                    currentMetadata.push(`${point.date.split('T')[0]}T${point.time}`); 
                    bounds.extend(latLng); 
                    previousTime = currentTime; 
                });

                if (currentPath.length > 0) {
                    paths.push({ path: currentPath, metadata: currentMetadata, startTimePath: startTimePath, endTimePath: endTimePath }); 
                }
                
                // Create windows for path selecting
                createPathSelector(paths);
                selectPath(0, paths);
                usedPaths = paths;

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

toggleSwitch.addEventListener("click", function() {
    latitudeInput.disabled = true;
    longitudeInput.disabled = true;

    if (positionFiltering) {
        positionFiltering = !positionFiltering;
        positionOptions.classList.remove("visible");
        
        hiderContainerPosition.classList.remove("visible");
        setTimeout(function() {
            hiderContainerPosition.style.display = 'none';
            hiderPosition.classList.add("collapsed");
        }, 200);

        disableMapClick();
        clearMap();

        timeFilterBtn.click();
        
    } else {
        positionOptions.classList.add("visible");
        positionFiltering = !positionFiltering;
        positionOptionsVisible = true;

        hiderContainerPosition.classList.add("visible");
        setTimeout(function() {
            hiderContainerPosition.style.display = 'block';
        }, 200);
        
        
        enableMapClick();

        infoBox.style.display = "block";
        infoBox.style.opacity = 1;

        setTimeout(function() {
            infoBox.style.opacity = 0;
        }, 1000);

        setTimeout(function() {
            infoBox.style.display = "none"; 
        }, 2000); 
    }
});

hiderPosition.addEventListener("click", function() {
    if (positionOptionsVisible) {
        positionOptionsVisible = !positionOptionsVisible;
        positionOptions.classList.remove("visible");
        hiderPosition.classList.remove("collapsed");
        
    } else {
        positionOptionsVisible = !positionOptionsVisible;
        positionOptions.classList.add("visible");
        hiderPosition.classList.add("collapsed");
    }
});

hiderPath.addEventListener("click", function() {
    pointDate.disabled = true;
    pointTime.disabled = true;

    if (pathOptionsVisible) {
        pathOptionsVisible = !pathOptionsVisible;
        pathOptions.classList.remove("visible");
        hiderPath.classList.remove("collapsed");
        
    } else {
        pathOptionsVisible = !pathOptionsVisible;
        pathOptions.classList.add("visible");
        hiderPath.classList.add("collapsed");
    }
});

// Create path selector
function createPathSelector(paths) {
    pathButtonsContainer.innerHTML = ''; 

    if (paths.length === 0) {
        pathSelectorContainer.style.display = 'none';
        return;
    }
    pathSelectorContainer.style.display = 'block'; 
    pointDate.disabled = true;
    pointTime.disabled = true;

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

        button.setAttribute('data-tippy-content', `${startTimeFormatted} to ${endTimeFormatted}`);

        buttonContainer.appendChild(button);
        pathButtonsContainer.appendChild(buttonContainer);
    });

    // Initialize Tippy.js in each path button
    tippy('.pathButton', {
        theme: 'light', 
        placement: 'top', 
        animation: 'scale',
        duration: [0, 0], 
        delay: [0, 0], 
        hideOnClick: true, 
        trigger: 'mouseenter focus', 
        interactive: true, 
        appendTo: document.body,
        maxWidth: '160px'
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

    currentPathIndex = index;
    currentPointIndex = 0;

    updateDateTime(paths);

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

    updateMarkerPosition(paths[currentPathIndex].path[currentPointIndex]);
}

function formatDateAndTimeControl(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return { day, month, year, hours, minutes, seconds };
}

function updateDateTime(paths) {
    const formattedDateTime  = formatDateAndTimeControl(new Date(paths[currentPathIndex].metadata[currentPointIndex]));
    
    pointDate.value = `${formattedDateTime.day}-${formattedDateTime.month}-${formattedDateTime.year}`;
    pointTime.value = `${formattedDateTime.hours}:${formattedDateTime.minutes}:${formattedDateTime.seconds}`;

    updateButtonStates(paths);
}

let intervalId = null;

function startHolding(action) {
    action();
    intervalId = setInterval(action, 200);
}

function stopHolding() {
    clearInterval(intervalId);
    intervalId = null;
}

function updateButtonStates(paths) {
    if (currentPointIndex === 0) {
        previousPoint.disabled = true;
        previousPoint.style.cursor = 'not-allowed';
        previousPoint.style.opacity = 0.5;
    } else {
        previousPoint.disabled = false;
        previousPoint.style.cursor = 'pointer';
        previousPoint.style.opacity = 1;
    }

    if (currentPointIndex === paths[currentPathIndex].path.length - 1) {
        nextPoint.disabled = true;
        nextPoint.style.cursor = 'not-allowed';
        nextPoint.style.opacity = 0.5;
    } else {
        nextPoint.disabled = false;
        nextPoint.style.cursor = 'pointer';
        nextPoint.style.opacity = 1;
    }
}

previousPoint.addEventListener('mousedown', () => {
    startHolding(() => {
        if (currentPointIndex > 0) {
            currentPointIndex--;
            updateDateTime(usedPaths);
            updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
            updateButtonStates(usedPaths); 
        }
    });
});

previousPoint.addEventListener('mouseup', stopHolding);
previousPoint.addEventListener('mouseleave', stopHolding);

nextPoint.addEventListener('mousedown', () => {
    startHolding(() => {
        if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
            currentPointIndex++;
            updateDateTime(usedPaths);
            updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
            updateButtonStates(usedPaths); 
        }
    });
});

nextPoint.addEventListener('mouseup', stopHolding);
nextPoint.addEventListener('mouseleave', stopHolding);

function updateMarkerPosition(latLng) {
    const icon = {
        url: 'media/favicon.svg',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 35)
    };

    if (markers.length > 2) {
        markers[markers.length - 1].setPosition(latLng); 
    } else {
        markers.push(new google.maps.Marker({
            position: latLng,
            map: map,
            icon: icon,
            title: `Point ${currentPointIndex + 1} of Path ${currentPathIndex + 1}`
        }));
    }
}

playPoint.addEventListener('click', () => {
    if (!isPlaying) {
        playOption.src = 'media/pause.svg';
        isPlaying = true;

        playIntervalId = setInterval(() => {
            if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
                currentPointIndex++;
                updateDateTime(usedPaths);
                updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
                updateButtonStates(usedPaths);
            } else {
                clearInterval(playIntervalId);
                isPlaying = false;
                playOption.src = 'media/play.svg';
            }
        }, currentVelocity);
    } else {
        // Pausar la reproducción
        clearInterval(playIntervalId);
        isPlaying = false;
        playOption.src = 'media/play.svg';
    }
});

velocityPoint.addEventListener('click', () => {
    if (currentVelocity === 200) {
        currentVelocity = 100;
        velocityDisplay.textContent = 'x2';
    } else {
        currentVelocity = 200;
        velocityDisplay.textContent = 'x1';
    }

    if (isPlaying) {
        clearInterval(playIntervalId);
        playIntervalId = setInterval(() => {
            if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
                currentPointIndex++;
                updateDateTime(usedPaths);
                updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
                updateButtonStates(usedPaths);
            } else {
                clearInterval(playIntervalId);
                isPlaying = false;
                playOption.src = 'media/play.svg';
            }
        }, currentVelocity);
    }
});


// Delays
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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