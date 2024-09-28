let map; 
let polyline;
let path = [];
let markers = []; // Array para almacenar los marcadores

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

            clearMarkers(); // Limpia los marcadores antes de agregar nuevos

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

                // Crear y almacenar los marcadores
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
            polyline.setMap(null);
            path = [];
            clearMarkers(); // Limpia los marcadores en caso de error

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
                circle = null;
            }

            isSelectingLocation = true;
            selectLocationBtn.textContent = 'Set Location';
            map.setOptions({ draggableCursor: 'crosshair' });

            google.maps.event.addListenerOnce(map, 'click', function (event) {
                selectedPosition = event.latLng;

                circle = new google.maps.Circle({
                    strokeColor: '#6309CE',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#C3AAff',
                    fillOpacity: 0.35,
                    map: map,
                    center: selectedPosition,
                    radius: parseFloat(radiusInput.value) || 5
                });

                map.setOptions({ draggableCursor: 'default' });
                selectLocationBtn.textContent = 'Select on Map';

                // Actualizar el input de radio al cambiar el tamaño del círculo
                google.maps.event.addListener(circle, 'radius_changed', function() {
                    radiusInput.value = circle.getRadius();
                });

                // Cambiar el radio si el input es editado
                radiusInput.addEventListener('input', function() {
                    circle.setRadius(parseFloat(this.value) || 5);
                });
            });
        } else {
            if (circle) {
                circle.setMap(null); 
                circle = null;
            }

            isSelectingLocation = false;
            selectLocationBtn.textContent = 'Select on Map';
            map.setOptions({ draggableCursor: 'default' });
        }
    });
});

function clearMap() {
    if (polyline) {
        polyline.setMap(null);
        polyline = null; // Asegúrate de reiniciar polyline
    }
    clearMarkers(); // Limpia los marcadores
    if (circle) {
        circle.setMap(null); 
        circle = null; // Asegúrate de reiniciar el círculo
    }
    path = []; // Limpia el camino
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = []; // Reinicia el array de marcadores
}
