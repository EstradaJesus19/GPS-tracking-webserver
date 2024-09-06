// Location data
const ws = new WebSocket('ws://trackit1.ddns.net:80');

let currentMarker = null;

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = data.date;
    document.getElementById('time').textContent = data.time;
    document.getElementById('provider').textContent = data.provider;

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    currentMarker = L.marker([data.latitude, data.longitude]).addTo(map);
};

ws.onopen = () => {
    console.log('WebSocket connection opened');
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Visualization map
var map = L.map('map').setView([10.98, -74.8], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
