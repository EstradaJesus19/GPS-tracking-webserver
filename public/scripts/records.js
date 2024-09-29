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
    const radiusInput = document.getElementById('radiusInput');
    const pathSelectorContainer = document.getElementById('pathSelector');
    const positionFilterBtn = document.getElementById('positionFilterBtn');
    
    selectLocationBtn.addEventListener('click', function () {
        if (!isSelectingLocation) {
            clearMap()
            pathSelectorContainer.style.display = 'none';
            isSelectingLocation = true;
            selectedPosition = null;
            selectLocationBtn.textContent = 'Set location';
            selectLocationBtn.style.backgroundColor = 'purple';
            enableMapClick();
            map.setOptions({ draggableCursor: 'crosshair' });

            positionFilterBtn.style.backgroundColor = 'white';
            positionFilterBtn.style.color = 'purple';
            positionFilterBtn.style.borderColor = 'purple';
            positionFilterBtn.disabled = true; 
        } else {
            if (selectedPosition) {
                circle.setEditable(false);
                circle.setDraggable(false);
                isSelectingLocation = false;
                selectLocationBtn.textContent = 'Select on map';
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

                // Reset positionFilterBtn styles
                positionFilterBtn.disabled = false;
                positionFilterBtn.style.backgroundColor = ''; // Reset to original
                positionFilterBtn.style.color = ''; // Reset to original
                positionFilterBtn.style.borderColor = ''; // Reset to original

                displayConfirmCancelButtons();
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
        }
    });

    radiusInput.addEventListener('input', function () {
        if (circle) {
            const newRadius = parseFloat(radiusInput.value);
            circle.setRadius(newRadius);
        }
    });
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

    document.getElementById('selectLocationBtn').textContent = 'Set location';
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
                    const latLng = new google.maps.LatLng(point.latitude, point.longitude);
                    const pointTime = new Date(point.time); 

                    if (index === 0 || (pointTime - previousTime) < 120000) { 
                        currentPath.push(latLng);
                        bounds.extend(latLng);

                        if (index === 0) {
                            startTime = point.time;
                        }

                        previousTime = pointTime; 
                    } else {
                        paths.push({ path: currentPath, startTime, endTime: previousTime }); 
                        currentPath = [latLng]; 
                        previousTime = pointTime;
                        startTime = point.time;
                    }

                    endTime = point.time;
                });

                if (currentPath.length > 0) {
                    paths.push({ path: currentPath, startTime, endTime }); 
                }

                paths.forEach((segment, i) => {
                    const segmentPolyline = new google.maps.Polyline({
                        path: segment.path,
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

                    segmentPolyline.setMap(map);
                    polylines.push(segmentPolyline);
                });

                map.fitBounds(bounds);

                markers.push(new google.maps.Marker({
                    position: paths[0].path[0],
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
                    position: paths[paths.length - 1].path[paths[paths.length - 1].path.length - 1],
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
                    text: 'No data found in the specified position.',
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
                text: 'Error getting position filtered data: ' + error,
                icon: 'error',
                iconColor: '#6309CE',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#6309CE',
                customClass: {
                    popup: 'swal2-custom-font',
                    icon: 'swal2-icon-info-custom'
                }
            });
            console.error('Error getting position filtered data: ', error);
        });
});

function displayConfirmCancelButtons() {
    const pathSelectorContainer = document.getElementById('pathSelector');
    pathSelectorContainer.style.display = 'block';
}

document.getElementById('cancelPathSelectionBtn').addEventListener('click', function () {
    clearMap();
    document.getElementById('pathSelector').style.display = 'none';
    document.getElementById('selectLocationBtn').textContent = 'Select on map';
    isSelectingLocation = false;
});

document.getElementById('confirmPathSelectionBtn').addEventListener('click', function () {
    const positionFilterBtn = document.getElementById('positionFilterBtn');
    document.getElementById('pathSelector').style.display = 'none';
    positionFilterBtn.style.backgroundColor = ''; 
    positionFilterBtn.style.color = ''; 
    positionFilterBtn.style.borderColor = ''; 
    positionFilterBtn.disabled = false; 
});