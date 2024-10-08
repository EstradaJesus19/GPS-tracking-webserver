let map;
let marker;
let polyline;
let path = [];
let oldPath = [];
let streetViewPanorama;
let streetViewActive = false; // Variable para controlar si Street View está activo
let latestPosition = null; // Última posición recibida

function loadLastLocation() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];
                latestPosition = {
                    lat: parseFloat(latestData.latitude),
                    lng: parseFloat(latestData.longitude)
                };
                path.push(latestPosition);
                oldPath.push(latestPosition);
                polyline.setPath(path);
                updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

fetch('/api/getOwner')
    .then(response => response.json())
    .then(data => {
        document.title = `Real time - ${data.owner}`;
    })
    .catch(error => console.error('Error fetching owner:', error));

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
        console.error('Error getting API key:', error);
    });

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        fullscreenControl: false
    });

    polyline = new google.maps.Polyline({
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
    });
    polyline.setMap(map);

    // Inicializa Street View pero no lo muestra hasta que se haga clic en el botón
    streetViewPanorama = new google.maps.StreetViewPanorama(document.getElementById('street-view'), {
        position: { lat: 10.98, lng: -74.81 },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        visible: false // Oculto por defecto
    });

    loadLastLocation();

    setInterval(fetchLatestData, 100);
    
    // Agrega el botón para habilitar Street View
    document.getElementById('street-view-button').addEventListener('click', () => {
        toggleStreetView();
    });
}

function fetchLatestData() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];
                latestPosition = {
                    lat: parseFloat(latestData.latitude),
                    lng: parseFloat(latestData.longitude)
                };

                const lastPosition = path.length > 0 ? path[path.length - 1] : null;
                if (!lastPosition || lastPosition.lat !== latestPosition.lat || lastPosition.lng !== latestPosition.lng) {
                    if (oldPath.length > 0) {
                        oldPath = [];
                        path = [];
                    }

                    path.push(latestPosition);
                    polyline.setPath(path);

                    updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);

                    // Actualiza la posición de Street View si está activo
                    if (streetViewActive) {
                        streetViewPanorama.setPosition(latestPosition);
                    }
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

    const date = new Date(data.date);
    const formattedDate = date.toISOString().split('T')[0];

    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = formattedDate;
    document.getElementById('time').textContent = data.time;
}

// Función para alternar el Street View
function toggleStreetView() {
    if (!latestPosition) return; // Si no hay datos aún, no hace nada

    streetViewActive = !streetViewActive;
    streetViewPanorama.setPosition(latestPosition); // Comienza en la última posición recibida
    streetViewPanorama.setVisible(streetViewActive); // Activa o desactiva el modo Street View
}
