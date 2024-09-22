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
        console.error('Error al obtener la API Key:', error);
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
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                endFlatpickr.set('minDate', selectedDate); 
            }
        }
    });

    const endFlatpickr = flatpickr(endInput, {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        time_24hr: true,
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

        input.addEventListener('focus', function () {
            e.target.select();
        });
    });
});

document.getElementById('filter-btn').addEventListener('click', function (e) {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    e.preventDefault(); // Evita el envío del formulario

    const startTime = startInput.value;
    const endTime = endInput.value;

    // Realizar la solicitud a la API para filtrar los datos
    fetch(`/api/filterData?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
        .then(response => response.json())
        .then(data => {
            // Borrar la polilínea anterior
            polyline.setMap(null);
            path = []; // Reiniciar el path

            if (data.length > 0) {
                // Construir la nueva polilínea
                data.forEach(point => {
                    path.push({ lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) });
                });

                // Dibujar la nueva polilínea
                polyline = new google.maps.Polyline({
                    path: path,
                    strokeColor: '#6309CE',
                    strokeOpacity: 1.0,
                    strokeWeight: 5,
                });
                polyline.setMap(map);
            } else {
                // Mostrar SweetAlert si no se encuentran datos
                Swal.fire({
                    text: 'No se encontraron datos en el rango de tiempo especificado.',
                    icon: 'info',
                    iconColor: '#6309CE', // Cambia el color del ícono de información a morado
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#6309CE', // Color del botón morado
                    customClass: {
                        popup: 'swal2-custom-font', // Clase CSS personalizada para la fuente
                        icon: 'swal2-icon-info-custom' // Clase personalizada para cambiar el color del ícono
                    }
                });
            }
        })
        .catch(error => {
            // Borrar la polilínea anterior
            polyline.setMap(null);
            path = []; // Reiniciar el path

            // Mostrar SweetAlert en caso de error
            Swal.fire({
                text: 'Error al obtener los datos filtrados: ' + error,
                icon: 'error',
                iconColor: '#6309CE', // Cambia el color del ícono de error a morado
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#6309CE', // Color del botón morado
                customClass: {
                    popup: 'swal2-custom-font', // Clase CSS personalizada para la fuente
                    icon: 'swal2-icon-info-custom' // Clase personalizada para cambiar el color del ícono
                }
            });
            console.error('Error al obtener los datos filtrados:', error);
        });
});