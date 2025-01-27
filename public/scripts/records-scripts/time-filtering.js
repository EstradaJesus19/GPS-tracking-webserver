import { clearMap } from './clear-options.js';
import { map, markers, polylines } from './init.js';
import { disableCarVariables } from './car-variables.js';

// Definir variables
export let startTime = null;
export let endTime = null;
let paths = {};

const startInput = document.getElementById('startDateTime');
const endInput = document.getElementById('endDateTime');
const timeFilterBtn = document.getElementById('timeFilterBtn');
const pathSelectorContainer = document.getElementById('pathSelector');
const positionControl = document.getElementById('positionControl');
const vehicleSelector = document.getElementById('vehicleSelector');

// Colores para las polilíneas de cada vehículo
const polylineColors = {
    1: '#6309CE',
    2: '#a80aa8'
};

// Filtrado temporal de rutas históricas
export function timeFiltering() {
    timeFilterBtn.addEventListener('click', function (e) {
        e.preventDefault();

        // Mensaje si no se selecciona el marco temporal
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
        paths = {};
        disableCarVariables();

        pathSelectorContainer.style.display = 'none';
        positionControl.style.display = 'block';

        startTime = convertToDatabaseFormat(startInput.value);
        endTime = convertToDatabaseFormat(endInput.value);

        const selectedVehicle = vehicleSelector.value;
        const bounds = new google.maps.LatLngBounds();

        // Solicitar datos filtrados por vehículo y por tiempo
        fetch(`/api/filterDataByTime?vehicleId=${selectedVehicle}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    let currentPath = [];
                    let previousTime = null;
                    let lastPoint = null;
                    let startTimePath = null;
                    let endTimePath = null;

                    data.forEach(point => {
                        if (point.vehicle_id != selectedVehicle) return;

                        const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };
                        const currentTimeString = `${point.date.split('T')[0]}T${point.time}`;
                        const currentTime = new Date(currentTimeString);

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

                        // Crear nueva trayectoria si la diferencia de tiempo > 60 segundos o la distancia > 1000 metros
                        if (timeDifference > 60 || distance > 1000) {
                            if (currentPath.length > 0) {
                                if (!paths[selectedVehicle]) paths[selectedVehicle] = [];
                                paths[selectedVehicle].push({ path: currentPath, startTimePath, endTimePath });
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

                    if (currentPath.length > 0) {
                        if (!paths[selectedVehicle]) paths[selectedVehicle] = [];
                        paths[selectedVehicle].push({ path: currentPath, startTimePath, endTimePath });
                    }

                    // Dibujar polilíneas
                    paths[selectedVehicle].forEach((vehiclePath, index) => {
                        const polyline = new google.maps.Polyline({
                            path: vehiclePath.path,
                            strokeColor: polylineColors[selectedVehicle] || '#000000',
                            strokeOpacity: 1.0,
                            strokeWeight: 5,
                            icons: [{
                                icon: {
                                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                    scale: 3,
                                    strokeColor: polylineColors[selectedVehicle] || '#000000',
                                    strokeWeight: 2,
                                    fillColor: polylineColors[selectedVehicle] || '#000000',
                                    fillOpacity: 1.0,
                                },
                                offset: '100%',
                                repeat: '100px'
                            }]
                        });

                        polyline.setMap(map);
                        polylines.push(polyline);

                        markers.push(new google.maps.Marker({
                            position: vehiclePath.path[0],
                            map: map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 5,
                                fillColor: "#C3AAff",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: polylineColors[selectedVehicle] || '#000000'
                            },
                            title: `Start of Path ${index + 1} for Vehicle ${selectedVehicle}`
                        }));

                        markers.push(new google.maps.Marker({
                            position: vehiclePath.path[vehiclePath.path.length - 1],
                            map: map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 5,
                                fillColor: "#C3AAff",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: polylineColors[selectedVehicle] || '#000000'
                            },
                            title: `End of Path ${index + 1} for Vehicle ${selectedVehicle}`
                        }));
                    });

                    map.fitBounds(bounds);
                } else {
                    // Advertencia si no se encuentran datos
                    Swal.fire({
                        text: `No data found for Vehicle ${selectedVehicle} in the specified time frame.`,
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
                console.error('Error getting filtered data for Vehicle ' + selectedVehicle + ':', error);
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
            });
    });
}

// Convertir fecha y hora al formato de base de datos
function convertToDatabaseFormat(dateTimeStr) {
    const [day, month, yearTime] = dateTimeStr.split('-');
    const [year, time] = yearTime.split(' ');
    return `${year}-${month}-${day} ${time}`;
}
