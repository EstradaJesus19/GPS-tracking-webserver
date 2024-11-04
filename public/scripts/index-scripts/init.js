import { fetchLatestData, loadLastLocation } from './fetch-data.js';

// Definir variables para el mapa y las polilíneas
export let map;

// Elementos del DOM
const mapElement = document.getElementById('map');
const vehicle1Checkbox = document.getElementById('vehicle1Checkbox');
const vehicle2Checkbox = document.getElementById('vehicle2Checkbox');

// Obtener y mostrar el nombre del propietario en el título de la página
export function getServerOwner() {
    fetch('/api/getOwner')
        .then(response => response.json())
        .then(data => {
            document.title = `Real time - ${data.owner}`;
        })
        .catch(error => console.error('Error fetching owner:', error));
}

// Obtener la API key y cargar el API de Google Maps
function getApiKey() {
    fetch('/api/getApiKey')
        .then(response => response.json())
        .then(data => {
            loadGoogleMapsApi(data.apiKey);
        })
        .catch(error => {
            console.error('Error getting API key:', error);
        });
}

// Cargar la API de Google Maps
function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&loading=async&libraries=maps,marker&v=beta`;
    document.head.appendChild(script);
}

// Inicializar el mapa
function initMap() {
    // Configurar el mapa inicial
    map = new google.maps.Map(mapElement, {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        disableDefaultUI: true
    });

    // Cargar la última ubicación para cada vehículo
    loadLastLocation(1);
    loadLastLocation(2);

    // Configurar la actualización periódica para cada vehículo
    setInterval(() => {
        if (vehicle1Checkbox.checked) {
            fetchLatestData(1);
        }
        if (vehicle2Checkbox.checked) {
            fetchLatestData(2);
        }
    }, 1000); // Intervalo de actualización en milisegundos
}

// Controlar la visibilidad de las polilíneas de cada vehículo según el estado de los checkboxes
function toggleVehicleVisibility(vehicleId, visible) {
    if (vehiclePaths[vehicleId] && vehiclePaths[vehicleId].polyline) {
        vehiclePaths[vehicleId].polyline.setMap(visible ? map : null);
    }
}

// Agregar eventos a los checkboxes para mostrar u ocultar polilíneas
vehicle1Checkbox.addEventListener('change', (event) => {
    toggleVehicleVisibility(1, event.target.checked);
});

vehicle2Checkbox.addEventListener('change', (event) => {
    toggleVehicleVisibility(2, event.target.checked);
});

// Función principal para iniciar el proceso
export function mainProcess() {
    getServerOwner();
    getApiKey();
}

window.initMap = initMap;
