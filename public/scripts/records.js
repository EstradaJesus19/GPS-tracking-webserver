let map; 
let polyline;
let path = [];
let polylines = [];
let markers = [];
let circle = null;
let isSelectingLocation = false;
let selectedPosition = null;

fetch('/api/getOwner')
    .then(response => response.json())
    .then(data => {
        document.title = `Real time - ${data.owner}`;
    })
    .catch(error => console.error('Error fetching owner:', error));

function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=maps,marker&v=beta`;
    script.async = true;
    document.head.appendChild(script);
}

fetch('/api/getApiKey')
    .then(response => response.json())
    .then(data => {
        loadGoogleMapsApi(data.apiKey);
    })
    .catch(error => {
        console.error('Error getting API Key:', error);
    });

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
    });

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

document.addEventListener('DOMContentLoaded', function () {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    function getMaxDate() {
        return new Date();
    }

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

document.getElementById('timeFilterBtn').addEventListener('click', function (e) {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    e.preventDefault(); 

    clearMap();
    path = [];

    const startTime = convertToDatabaseFormat(startInput.value);
    const endTime = convertToDatabaseFormat(endInput.value);

    fetch(`/api/filterData?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
        .then(response => response.json())
        .then(data => {

            if (data.length > 0) {
                const bounds = new google.maps.LatLngBounds();

                data.forEach(point => {
                    const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };
                    path.push(latLng);
                    bounds.extend(latLng);
                });

                polyline = new google.maps.Polyline({
                    path: path,
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
                map.fitBounds(bounds);

                markers.push(new google.maps.Marker({
                    position: path[0],
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        fillColor: "#C3AAff",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#6309CE"
                    },
                    title: "Start"
                }));

                markers.push(new google.maps.Marker({
                    position: path[path.length - 1],
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        fillColor: "#C3AAff",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#6309CE"
                    },
                    title: "End"
                }));

            } else {
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

function convertToDatabaseFormat(dateTimeStr) {
    const [day, month, yearTime] = dateTimeStr.split('-');
    const [year, time] = yearTime.split(' ');
    return `${year}-${month}-${day} ${time}`;
}

document.getElementById('filterType').addEventListener('change', function (e) {
    const selectedFilter = e.target.value;
    const pathSelectorContainer = document.getElementById('pathSelector');
    document.getElementById('timeFilterForm').style.display = selectedFilter === 'time' ? 'block' : 'none';
    document.getElementById('positionFilterForm').style.display = selectedFilter === 'position' ? 'block' : 'none';
    pathSelectorContainer.style.display = 'none';
    clearMap();
});

document.addEventListener('DOMContentLoaded', function () {
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    const selectLocationContainer = document.getElementById('selectLocationContainer');
    const positionFilterBtn = document.getElementById('positionFilterBtn');
    const radiusInput = document.getElementById('radiusInput');
    const pathSelectorContainer = document.getElementById('pathSelector');

    selectLocationBtn.addEventListener('click', function () {
        if (!isSelectingLocation) {
            clearMap();
            pathSelectorContainer.style.display = 'none';
            isSelectingLocation = true;
            selectedPosition = null;
            // positionFilterBtn.style.backgroundColor = 'white';
            // positionFilterBtn.style.color = '#6309CE';
            // positionFilterBtn.style.border = '2px solid #6309CE';
            // positionFilterBtn.disabled = true;
            positionFilterBtn.style.opacity = 0.5;
            positionFilterBtn.style.cursor = 'not-allowed';

            selectLocationBtn.style.display = 'none'; 
            createLocationButtons();

            enableMapClick();
            map.setOptions({ draggableCursor: 'crosshair' });
        }
    });

    function createLocationButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'locationButtons';
        buttonContainer.style.display = 'inline';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.justifyContent = 'center';

        // Botón de chulito
        const checkBtn = document.createElement('button');
        checkBtn.innerHTML = '<img src="media/check.svg" alt="Check">';
        checkBtn.style.backgroundColor = '#ffffff';
        checkBtn.style.border = '2px solid #6309CE';
        checkBtn.style.borderRadius = '50%';
        checkBtn.style.width = '40px';
        checkBtn.style.height = '40px';
        checkBtn.style.cursor = 'pointer';
        checkBtn.style.marginRight = '10px';
        checkBtn.style.padding = '2px';

        checkBtn.addEventListener('click', function () {
            if (selectedPosition) {
                console.log(selectedPosition);
                circle.setEditable(false);
                circle.setDraggable(false);
                isSelectingLocation = false;

                clearLocationButtons(); // Limpiar los botones morados
                selectLocationBtn.style.display = 'inline'; // Mostrar el botón selectLocationBtn de nuevo

                // positionFilterBtn.style.backgroundColor = ''; // Reestablecer estilo del botón
                // positionFilterBtn.style.color = '';
                // positionFilterBtn.style.border = '';
                positionFilterBtn.style.opacity = 1;
                positionFilterBtn.style.cursor = 'pointer';

                map.setOptions({ draggableCursor: null });
                disableMapClick();

                markers.push(new google.maps.Marker({
                    position: selectedPosition,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        fillColor: "#C3AAff",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#6309CE"
                    },
                    title: "Center"
                }));
                
            } else {
                Swal.fire({
                    text: 'Set a location on the map',
                    icon: 'error',
                    iconColor: '#6309CE',
                    confirmButtonText: 'Accept',
                    confirmButtonColor: '#6309CE',
                    customClass: {
                        popup: 'swal2-custom-font',
                        icon: 'swal2-icon-info-custom'
                    }
                });
            }
        });

        // Botón de x
        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<img src="media/cancel.svg" alt="Cancel">';
        cancelBtn.style.backgroundColor = '#ffffff';
        cancelBtn.style.border = '2px solid #6309CE';
        cancelBtn.style.borderRadius = '50%';
        cancelBtn.style.width = '40px';
        cancelBtn.style.height = '40px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.marginRight = '10px';
        cancelBtn.style.padding = '2px';

        cancelBtn.addEventListener('click', function () {
            clearLocationButtons(); // Limpiar los botones morados
            selectLocationBtn.style.display = 'inline'; // Mostrar el botón selectLocationBtn de nuevo

            clearMap();
            map.setOptions({ draggableCursor: null });
            disableMapClick();
            isSelectingLocation = false;

            // Reestablecer estilo del botón positionFilterBtn
            // positionFilterBtn.style.backgroundColor = '';
            // positionFilterBtn.style.color = '';
            // positionFilterBtn.style.border = '';
            // positionFilterBtn.disabled = false; // Habilitar el botón
            positionFilterBtn.style.opacity = 1;
            positionFilterBtn.style.cursor = 'pointer';
        });

        buttonContainer.appendChild(checkBtn);
        buttonContainer.appendChild(cancelBtn);
        selectLocationContainer.appendChild(buttonContainer);
    }

    function clearLocationButtons() {
        const buttonContainer = document.getElementById('locationButtons');
        if (buttonContainer) {
            buttonContainer.remove();
        }
    }

    radiusInput.addEventListener('input', function () {
        if (circle) {
            const newRadius = parseFloat(radiusInput.value);
            circle.setRadius(newRadius);
        }
    });

    function enableMapClick() {
        map.addListener('click', handleMapClick);
    }

    function disableMapClick() {
        google.maps.event.clearListeners(map, 'click');
    }

    function handleMapClick(event) {
        selectedPosition = event.latLng;
        clearMap();
        drawCircle(selectedPosition, parseFloat(radiusInput.value), true);
    }

    function drawCircle(position, radius, isEditable) {
        clearMap();

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
            circle.addListener('radius_changed', function () {
                const updatedRadius = Math.round(circle.getRadius());
                document.getElementById('radiusInput').value = updatedRadius;
            });

            circle.addListener('center_changed', function () {
                selectedPosition = circle.getCenter();
            });
        }
    }
});

function clearMap() {
    clearCircles();
    clearMarkers();
    clearPolylines();
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

function clearCircles() {
    if (circle) {
        circle.setMap(null);
        circle = null;
    }
}

function clearPolylines() {
    polylines.forEach(polyline => {
        polyline.setMap(null);
    });
    polylines = [];
}


document.getElementById('positionFilterBtn').addEventListener('click', function (e) { 
    e.preventDefault();

    if (isSelectingLocation || !radiusInput.value) {
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
        radius: parseFloat(radiusInput.value)
    };


    fetch(`/api/filterDataByPosition?latitude=${position.latitude}&longitude=${position.longitude}&radius=${position.radius}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                let paths = []; 
                let currentPath = []; 
                let previousTime = null; 
                let startTime = null;
                let endTime = null;

                data.forEach((point, index) => {
                    const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };

                    const currentTimeString = `${point.date.split('T')[0]}T${point.time}`; 
                    const currentTime = new Date(currentTimeString);

                    if (previousTime) {
                        const timeDifference = (currentTime - previousTime) / 1000; 

                        if (timeDifference > 60) {
                            if (currentPath.length > 0) {
                                paths.push({ path: currentPath, startTime: startTime, endTime: endTime }); 
                            }
                            currentPath = []; 
                        }
                    }

                    if (!currentPath.length) {
                        startTime = currentTime; 
                    }
                    endTime = currentTime; 
                    currentPath.push(latLng); 
                    bounds.extend(latLng); 
                    previousTime = currentTime; 
                });

                if (currentPath.length > 0) {
                    paths.push({ path: currentPath, startTime: startTime, endTime: endTime });
                }

                createPathSelector(paths);
                selectPath(0, paths);
                map.fitBounds(bounds);
            } else {
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
            clearMap();

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
});

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
        button.innerText = `Path ${index + 1}`;
        button.onclick = () => selectPath(index, paths);
        
        const startDate = new Date(pathInfo.startTime);
        const endDate = new Date(pathInfo.endTime);
        const startTimeFormatted = `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear().toString().slice(-2)} ${startDate.getHours()}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        const endTimeFormatted = `${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear().toString().slice(-2)} ${endDate.getHours()}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        
        const timeText = document.createElement('span');
        timeText.innerText = `: ${startTimeFormatted} to ${endTimeFormatted}`;
        timeText.style.marginLeft = '5px'; 

        buttonContainer.appendChild(button);
        buttonContainer.appendChild(timeText);
        pathButtonsContainer.appendChild(buttonContainer);
    });
}

function selectPath(index, paths) {
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
