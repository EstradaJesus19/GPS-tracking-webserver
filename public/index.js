let map;
let marker;
let polyline;

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
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });
    polyline.setMap(map);

    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            const path = data.map(point => ({
                lat: parseFloat(point.latitude),
                lng: parseFloat(point.longitude)
            }));
            polyline.setPath(path);
        })
        .catch(error => console.error('Error fetching data:', error));
}

function updateMap(lat, lng) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    const path = polyline.getPath();
    path.push(position);

    if (marker) {
        marker.setMap(null); 
    }

    marker = new google.maps.Marker({
        position,
        map,
        title: `Lat: ${lat}, Lng: ${lng}`,
    });

    map.setCenter(position);
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = data.date;
    document.getElementById('time').textContent = data.time;
    document.getElementById('provider').textContent = data.provider;

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
