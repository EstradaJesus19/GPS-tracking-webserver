let map;
let marker;
const ws = new WebSocket('ws://trackit1.ddns.net:443');

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
    });
}
function updateMap(lat, lng) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    if (marker) {
        marker.setMap(null); 
    }

    marker = new google.maps.Marker({
        position,
        map,
        title: `Lat: ${lat}, Lng: ${lng}`,
    });

    map.setCenter(position);
    map.setZoom(13); 
}

initMap()


ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = data.date;
    document.getElementById('time').textContent = data.time;
    document.getElementById('provider').textContent = data.provider;

    // Actualizar el mapa con la nueva ubicación
    updateMap(data.latitude, data.longitude);
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
