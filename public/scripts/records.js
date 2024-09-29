let map; 
let polyline;
let path = [];
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

    const startTime = convertToDatabaseFormat(startInput.value);
    const endTime = convertToDatabaseFormat(endInput.value);

    fetch(`/api/filterData?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
        .then(response => response.json())
        .then(data => {
            clearMap(); 

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
    document.getElementById('timeFilterForm').style.display = selectedFilter === 'time' ? 'block' : 'none';
    document.getElementById('positionFilterForm').style.display = selectedFilter === 'position' ? 'block' : 'none';
    clearMap();
});

document.addEventListener('DOMContentLoaded', function () {
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    const radiusInput = document.getElementById('radiusInput');
    
    selectLocationBtn.addEventListener('click', function () {
        if (!isSelectingLocation) {
            clearMap()
            isSelectingLocation = true;
            selectLocationBtn.textContent = 'Set location';
            enableMapClick();
            map.setOptions({ draggableCursor: 'crosshair' }); 
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

            } else {
                Swal.fire({
                    text: 'Select a location on the map',
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
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: '#C3AAff',
        fillOpacity: 0.5,
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
    if (polyline) {
        polyline.setMap(null);
        polyline = null; 
    }
    clearMarkers(); 
    if (circle) {
        circle.setMap(null); 
        circle = null; 
    }
    path = []; 
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = []; 
}

document.getElementById('positionFilterBtn').addEventListener('click', function () {
    e.preventDefault();

    const radius = parseFloat(radiusInput.value);
    const lat = selectedPosition.lat();
    const lng = selectedPosition.lng();

    fetch(`/api/getDataInRadius?lat=${lat}&lng=${lng}&radius=${radius}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                organizePaths(data);
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
            console.error('Error fetching data:', error);
        });
});

function organizePaths(data) {
    const paths = [];
    let currentPath = [];
    let lastTime = null;

    data.forEach(point => {
        const pointTime = new Date(`${point.date} ${point.time}`).getTime();

        if (!lastTime || pointTime - lastTime <= 60000) {
            currentPath.push({ lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) });
        } else {
            if (currentPath.length > 0) {
                paths.push(currentPath);
                currentPath = [];
            }
            currentPath.push({ lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) });
        }

        lastTime = pointTime;
    });

    if (currentPath.length > 0) {
        paths.push(currentPath);
    }

    createCheckboxWindow(paths);
}

function createCheckboxWindow(paths) {
    const container = document.createElement('div');
    container.classList.add('path-selection');

    paths.forEach((path, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `path${index}`;
        checkbox.checked = index === 0; // Por defecto selecciona el primer path
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                drawPathOnMap(path);
            }
            document.getElementById(`path${index === 0 ? 1 : 0}`).checked = false; // Desmarcar otro checkbox
        });

        const label = document.createElement('label');
        label.htmlFor = `path${index}`;
        label.textContent = `Time ${index + 1}`;

        container.appendChild(checkbox);
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
    });

    const modal = Swal.fire({
        title: 'Select a Path',
        html: container,
        showConfirmButton: true,
        confirmButtonText: 'Close'
    });
}


function drawPathOnMap(path) {
    clearMap(); // Borra el mapa antes de dibujar un nuevo path

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
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => {
        bounds.extend(point);
    });
    map.fitBounds(bounds); // Ajustar el mapa para mostrar el path completo
}
