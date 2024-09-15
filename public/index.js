let map;
let marker;
let polyline;
let lastData = null;

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
        strokeWeight: 5,
    });
    polyline.setMap(map);

    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const path = data.map(point => ({
                    lat: parseFloat(point.latitude),
                    lng: parseFloat(point.longitude)
                }));
                polyline.setPath(path);

                const latestData = data[data.length - 1];
                updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);

                lastData = latestData;
            }
        })
        .catch(error => console.error('Error fetching data:', error));

    setInterval(fetchLatestData, 50);
}

function fetchLatestData() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];

                if (lastData === null || latestData.date !== lastData.date || latestData.time !== lastData.time) {
                    const position = {
                        lat: parseFloat(latestData.latitude),
                        lng: parseFloat(latestData.longitude)
                    };

                    const path = polyline.getPath();
                    path.push(position);

                    updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);

                    lastData = latestData;
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

    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = data.date;
    document.getElementById('time').textContent = data.time;
    document.getElementById('provider').textContent = data.provider;
}
