import { map, polyline, panorama } from './init.js';
import { updateFuelGauge, updateSpeedGauge, updateRPMGauge } from './car-variables.js';

// Define variables 
let path = [];
let oldPath = [];
export let marker;

const latitudeText = document.getElementById('latitude');
const longitudeText = document.getElementById('longitude');
const dateText = document.getElementById('date');
const timeText = document.getElementById('time');

// Load last location in database
export function loadLastLocation() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];
                const initialPosition = {
                    lat: parseFloat(latestData.latitude),
                    lng: parseFloat(latestData.longitude)
                };
                path.push(initialPosition);
                oldPath.push(initialPosition);
                polyline.setPath(path);
                updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);
                updateSpeedGauge(latestData.vel); 
                updateFuelGauge(latestData.fuel);
                updateRPMGauge(latestData.rpm)
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Fetch latest data from database
export function fetchLatestData() {
    const vehicle1Checked = document.getElementById('vehicle1').checked;
    const vehicle2Checked = document.getElementById('vehicle2').checked;

    const params = new URLSearchParams();
    if (vehicle1Checked) params.append('vehicle', '1');

    fetch(`/api/getAllData?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];

                const lastPosition = path.length > 0 ? path[path.length - 1] : null;
                if (!lastPosition || lastPosition.lat !== parseFloat(latestData.latitude) || lastPosition.lng !== parseFloat(latestData.longitude)) {
                    if (oldPath.length > 0) {
                        oldPath = [];
                        path = [];
                    }

                    const position = {
                        lat: parseFloat(latestData.latitude),
                        lng: parseFloat(latestData.longitude)
                    };

                    path.push(position);
                    polyline.setPath(path);

                    updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);
                    updateSpeedGauge(latestData.vel); 
                    updateFuelGauge(latestData.fuel);
                    updateRPMGauge(latestData.rpm)
                }
            }
        })
        .catch(error => console.error('Error fetching latest data:', error));
}

// Update marker and info window
function updateMarkerAndInfo(lat, lng, data) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    if (marker) {
        marker.setMap(null);
    }

    const icon = {
        url: 'media/favicon.svg',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 35)
    };

    marker = new google.maps.Marker({
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