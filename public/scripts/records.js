let map;
let polyline;
let path = [];

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
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, // Flecha
                scale: 3,
                strokeColor: '#6309CE',
                strokeWeight: 2,
            },
            offset: '100%', // Aparece al final de cada tramo
            repeat: '100px' // Repite cada 100px en la línea
        }]
    });
    polyline.setMap(map);
}

document.addEventListener('DOMContentLoaded', function () {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    const startFlatpickr = flatpickr(startInput, {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        time_24hr: true,
        maxDate: new Date(), 
        onOpen: function() {
            const now = new Date(); 
            this.set('maxDate', now); 
        },
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                endFlatpickr.set('minDate', selectedDate);
                endFlatpickr.set('maxDate', new Date()); 
            }
        }
    });

    const endFlatpickr = flatpickr(endInput, {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        time_24hr: true,
        maxDate: new Date(), 
        onOpen: function() {
            const now = new Date(); 
            this.set('maxDate', now);
        },
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                startFlatpickr.set('maxDate', selectedDate);
            }
        }
    });

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
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, // Flecha
                            scale: 3,
                            strokeColor: '#6309CE',
                            strokeWeight: 2,
                        },
                        offset: '100%', // Flecha en cada tramo
                        repeat: '100px' // Repite cada 100px
                    }]
                });
                polyline.setMap(map);

                map.fitBounds(bounds);

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
