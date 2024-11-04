import { fetchLatestData, loadLastLocation, vehiclePaths } from './fetch-data.js';
import { manageCarDataVisibility, selectVehicles } from './car-variables.js';

export let map;

const mapElement = document.getElementById('map');
const vehicle1Checkbox = document.getElementById('vehicle1Checkbox');
const vehicle2Checkbox = document.getElementById('vehicle2Checkbox');

export function getServerOwner() {
    fetch('/api/getOwner')
        .then(response => response.json())
        .then(data => {
            document.title = `Real time - ${data.owner}`;
        })
        .catch(error => console.error('Error fetching owner:', error));
}

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

function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&loading=async&libraries=maps,marker&v=beta`;
    document.head.appendChild(script);
}

function initMap() {
    map = new google.maps.Map(mapElement, {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        disableDefaultUI: true
    });

    loadLastLocation(1);
    loadLastLocation(2);

    setInterval(() => {
        fetchLatestData(1);
        fetchLatestData(2);
    }, 5000); 
}

function toggleVehicleVisibility(vehicleId, visible) {
    if (vehiclePaths[vehicleId]) {
        if (vehiclePaths[vehicleId].polyline) {
            vehiclePaths[vehicleId].polyline.setMap(visible ? map : null);
        }
        if (vehiclePaths[vehicleId].marker) {
            vehiclePaths[vehicleId].marker.setMap(visible ? map : null);
        }
    }
}

vehicle1Checkbox.addEventListener('change', (event) => {
    toggleVehicleVisibility(1, event.target.checked);
});

vehicle2Checkbox.addEventListener('change', (event) => {
    toggleVehicleVisibility(2, event.target.checked);
});

export function mainProcess() {
    document.addEventListener("DOMContentLoaded", () => {
        getServerOwner();
        getApiKey();
        selectVehicles();
        manageCarDataVisibility(); 
    });
}

window.initMap = initMap;
