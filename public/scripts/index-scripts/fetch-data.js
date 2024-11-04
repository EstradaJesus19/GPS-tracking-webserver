import { map, panorama } from './init.js';
import { updateFuelGauge, updateSpeedGauge, updateRPMGauge } from './car-variables.js';

// Define variables 
let vehiclePaths = {}; // Guardar las polilíneas y la información de cada vehículo
let vehicleColors = {}; // Colores únicos por cada vehículo

const latitudeText = document.getElementById('latitude');
const longitudeText = document.getElementById('longitude');
const dateText = document.getElementById('date');
const timeText = document.getElementById('time');

// Asignar un color único para cada vehículo
function getColorForVehicle(vehicleId) {
    if (!vehicleColors[vehicleId]) {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        vehicleColors[vehicleId] = colors[Object.keys(vehicleColors).length % colors.length];
    }
    return vehicleColors[vehicleId];
}

// Cargar la última ubicación de todos los vehículos
export function loadLastLocation() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            data.forEach(vehicleData => {
                const vehicleId = vehicleData.vehicle_id;
                const color = getColorForVehicle(vehicleId);

                if (!vehiclePaths[vehicleId]) {
                    vehiclePaths[vehicleId] = {
                        path: [],
                        polyline: new google.maps.Polyline({
                            strokeColor: color,
                            strokeOpacity: 1.0,
                            strokeWeight: 3,
                            map: map
                        })
                    };
                }

                const position = {
                    lat: parseFloat(vehicleData.latitude),
                    lng: parseFloat(vehicleData.longitude)
                };
                vehiclePaths[vehicleId].path.push(position);
                vehiclePaths[vehicleId].polyline.setPath(vehiclePaths[vehicleId].path);

                updateMarkerAndInfo(position.lat, position.lng, vehicleData, color);
                updateSpeedGauge(vehicleData.vel); 
                updateFuelGauge(vehicleData.fuel);
                updateRPMGauge(vehicleData.rpm);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Obtener datos actualizados y agregar a cada vehículo su polilínea
export function fetchLatestData() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            data.forEach(vehicleData => {
                const vehicleId = vehicleData.vehicle_id;
                const color = getColorForVehicle(vehicleId);

                if (!vehiclePaths[vehicleId]) {
                    vehiclePaths[vehicleId] = {
                        path: [],
                        polyline: new google.maps.Polyline({
                            strokeColor: color,
                            strokeOpacity: 1.0,
                            strokeWeight: 3,
                            map: map
                        })
                    };
                }

                const lastPosition = vehiclePaths[vehicleId].path.slice(-1)[0];
                const newPosition = {
                    lat: parseFloat(vehicleData.latitude),
                    lng: parseFloat(vehicleData.longitude)
                };

                if (!lastPosition || lastPosition.lat !== newPosition.lat || lastPosition.lng !== newPosition.lng) {
                    vehiclePaths[vehicleId].path.push(newPosition);
                    vehiclePaths[vehicleId].polyline.setPath(vehiclePaths[vehicleId].path);
                    updateMarkerAndInfo(newPosition.lat, newPosition.lng, vehicleData, color);
                    updateSpeedGauge(vehicleData.vel); 
                    updateFuelGauge(vehicleData.fuel);
                    updateRPMGauge(vehicleData.rpm);
                }
            });
        })
        .catch(error => console.error('Error fetching latest data:', error));
}

// Actualizar el marcador y la información
function updateMarkerAndInfo(lat, lng, data, color) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    const icon = {
        url: 'media/favicon.svg',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 35)
    };

    const marker = new google.maps.Marker({
        position,
        map,
        title: `Lat: ${lat}, Lng: ${lng}`,
        icon: icon
    });

    map.setCenter(position);
    panorama.setPosition(position);

    const date = new Date(data.date);
    const formattedDate = date.toISOString().split('T')[0];

    latitudeText.textContent = data.latitude;
    longitudeText.textContent = data.longitude;
    dateText.textContent = formattedDate;
    timeText.textContent = data.time;
}
