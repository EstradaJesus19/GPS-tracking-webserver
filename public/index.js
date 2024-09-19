let map;
let marker;
let polyline;
let path = [];
let directionsService;

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
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
    });
    polyline.setMap(map);

    directionsService = new google.maps.DirectionsService();

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
                polyline.setPath(path);

                updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);
            }
        })
        .catch(error => console.error('Error fetching data:', error));

    setInterval(fetchLatestData, 100); 

    fetch('/api/getOwner')
        .then(response => response.json())
        .then(data => {
            document.getElementById('owner').textContent = data.owner;
        })
        .catch(error => console.error('Error fetching owner:', error));
}

function fetchLatestData() {
    fetch('/api/getAllData')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];

                const lastPosition = path.length > 0 ? path[path.length - 1] : null;
                if (!lastPosition || lastPosition.lat !== parseFloat(latestData.latitude) || lastPosition.lng !== parseFloat(latestData.longitude)) {
                    const position = {
                        lat: parseFloat(latestData.latitude),
                        lng: parseFloat(latestData.longitude)
                    };

                    path.push(position);

                    smoothPolyline(path);

                    updateMarkerAndInfo(latestData.latitude, latestData.longitude, latestData);
                }
            }
        })
        .catch(error => console.error('Error fetching latest data:', error));
}

function smoothPolyline(path) {
    if (path.length < 2) {
        polyline.setPath(path);
        return;
    }

    const start = path[path.length - 2];
    const end = path[path.length - 1];

    const request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING'
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            const smoothPath = result.routes[0].overview_path;
            polyline.setPath([...polyline.getPath().getArray(), ...smoothPath]);
        } else {
            console.error('Error getting directions:', status);
            polyline.setPath(path); 
        }
    });
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
