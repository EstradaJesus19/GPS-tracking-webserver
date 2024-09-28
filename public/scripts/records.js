let map;
let polyline;
let path = [];

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

    [startInput, endInput].forEach(input => {
        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            let formattedValue = '';

            if (value.length >= 8) {
                formattedValue = `${value.substring(0, 2)}-${value.substring(2, 4)}-${value.substring(4, 8)}`;
                if (value.length > 8) {
                    formattedValue += ` ${value.substring(8, 10)}:${value.substring(10, 12)}`;
                }
            } else if (value.length >= 4) {
                formattedValue = `${value.substring(0, 2)}-${value.substring(2, 4)}`;
            } else if (value.length >= 2) {
                formattedValue = `${value.substring(0, 2)}`;
            }

            e.target.value = formattedValue;
        });

        input.addEventListener('focus', function (e) {
            e.target.select();
        });
    });
});

document.getElementById('filter-btn').addEventListener('click', function (e) {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    e.preventDefault(); 

    const startTime = convertToDatabaseFormat(startInput.value);
    const endTime = convertToDatabaseFormat(endInput.value);

    fetch(`/api/filterData?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
        .then(response => response.json())
        .then(data => {
            polyline.setMap(null);
            path = []; 

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

                new google.maps.Marker({
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
                });

                new google.maps.Marker({
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
                });

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
            polyline.setMap(null);
            path = [];

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

let circle = null;
let isSelectingLocation = false;
let selectedPosition = null;

document.addEventListener('DOMContentLoaded', function () {
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    const radiusInput = document.getElementById('radiusInput');
    
    selectLocationBtn.addEventListener('click', function () {
        if (!isSelectingLocation) {
            if (circle) {
                circle.setMap(null);
            }
            // Primera vez que se presiona "Set on map"
            isSelectingLocation = true;
            selectLocationBtn.textContent = 'Set location';
            enableMapClick();
            map.setOptions({ draggableCursor: 'crosshair' }); // Cambia el cursor al seleccionar en el mapa
        } else {
            // Después de seleccionar la ubicación, se fija el círculo
            if (selectedPosition) {
                // Fijar el círculo y deshabilitar la edición
                circle.setEditable(false);
                circle.setDraggable(false);
                isSelectingLocation = false;
                selectLocationBtn.textContent = 'Select on map';
                map.setOptions({ draggableCursor: null }); // Restaurar el cursor normal
                disableMapClick(); // Deshabilitar clics en el mapa

                new google.maps.Marker({
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
                    title: "Center"
                });
                
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

    // Si ya existe un círculo, se remueve
    if (circle) {
        circle.setMap(null);
    }

    // Crear un círculo editable en el punto seleccionado
    drawCircle(selectedPosition, parseFloat(radiusInput.value), true); // Editable inicialmente

    // Cambiar el texto del botón a "Set location"
    document.getElementById('selectLocationBtn').textContent = 'Set location';

    // Deshabilitar la capacidad de seleccionar más puntos hasta que se presione el botón de nuevo
    // disableMapClick();
}

function drawCircle(position, radius, isEditable) {
    // Si ya hay un círculo, lo eliminamos
    if (circle) {
        circle.setMap(null);
    }

    circle = new google.maps.Circle({
        center: position,
        radius: radius,
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: '#C3AAff',
        fillOpacity: 0.5,
        map: map,
        editable: isEditable,  // Si se puede editar o no
        draggable: isEditable  // Si se puede arrastrar o no
    });

    // Si el círculo es editable, sincronizar los cambios de radio con el input
    if (isEditable) {
        circle.addListener('radius_changed', function () {
            const updatedRadius = Math.round(circle.getRadius());
            document.getElementById('radiusInput').value = updatedRadius; // Actualizar el input
        });
    }
}

function clearMap() {
    circle.setMap(null);
    circle = null;
    polyline.setMap(null);
    path = [];
}