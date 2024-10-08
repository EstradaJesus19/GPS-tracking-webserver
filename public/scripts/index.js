let map;
let marker;
let polyline;
let path = [];
let oldPath = [];
let panorama;
let isStreetViewActive = false;

// Load last location in database
function loadLastLocation() {
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
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Get server owner and print it in the web page tittle
fetch('/api/getOwner')
    .then(response => response.json())
    .then(data => {
        document.title = `Real time - ${data.owner}`;
    })
    .catch(error => console.error('Error fetching owner:', error));

// Load Google Maps API    
function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=maps,marker&v=beta`;
    script.async = true;
    document.head.appendChild(script);
}

// Get APIKEY and load map API
fetch('/api/getApiKey')
    .then(response => response.json())
    .then(data => {
        loadGoogleMapsApi(data.apiKey);
    })
    .catch(error => {
        console.error('Error getting API key:', error);
    });

// Init map
function initMap() {
    // Build initial map
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        fullscreenControl: false,
        streetViewControl: false
    });

    // Enable street view button
    document.getElementById('streetViewButton').style.display = 'block';
    document.getElementById('streetViewButton').disabled = false;

    // Build polyline
    polyline = new google.maps.Polyline({
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
    });
    polyline.setMap(map);

    // Update street view data
    panorama = new google.maps.StreetViewPanorama(document.getElementById('map'), {
        position: { lat: 10.98, lng: -74.81 },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        visible: false,
        fullscreenControl: false
    });

    map.setStreetView(panorama);

    document.getElementById('streetViewButton').addEventListener('click', toggleStreetView);

    loadLastLocation();

    setInterval(fetchLatestData, 100);
}

// Fetch latest data from database
function fetchLatestData() {
    fetch('/api/getAllData')
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

    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = formattedDate;
    document.getElementById('time').textContent = data.time;
}

// Toggle street view/map view
function toggleStreetView() {
    const toggleButton = document.getElementById('streetViewButton');
    isStreetViewActive = !isStreetViewActive;
    panorama.setVisible(isStreetViewActive);
    if (!isStreetViewActive) {
        map.setCenter(marker.getPosition());
        toggleButton.innerText = 'Street View';
    } else{
        toggleButton.innerText = 'Map View';
    }
}
