let map;
let marker;
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
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });
    polyline.setMap(map);

    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                // Dibuja la ruta inicial con todos los puntos
                path = data.map(point => ({
                    lat: parseFloat(point.latitude),
                    lng: parseFloat(point.longitude)
                }));
                polyline.setPath(path);

                // Actualiza el marcador y la información con el último dato
                const latestData = data[data.length - 1];
                updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);
            }
        })
        .catch(error => console.error('Error fetching data:', error));

    // Inicia la función de actualización periódica
    setInterval(fetchLatestData, 5000); // Actualiza cada 5 segundos
}

function fetchLatestData() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];

                // Verifica si hay nuevos datos comparados con los últimos almacenados
                const lastPosition = path.length > 0 ? path[path.length - 1] : null;
                if (!lastPosition || lastPosition.lat !== parseFloat(latestData.latitude) || lastPosition.lng !== parseFloat(latestData.longitude)) {
                    const position = {
                        lat: parseFloat(latestData.latitude),
                        lng: parseFloat(latestData.longitude)
                    };

                    // Añade el nuevo punto a la polyline y al path
                    path.push(position);
                    polyline.setPath(path);

                    // Actualiza el marcador y la información con el último dato
                    updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);
                }
            }
        })
        .catch(error => console.error('Error fetching latest data:', error));
}

function updateMarkerAndInfo(lat, lng, data) {
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

    // Actualiza la información en la página
    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = data.date;
    document.getElementById('time').textContent = data.time;
    document.getElementById('provider').textContent = data.provider;
}
