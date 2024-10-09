import {getServerOwner} from './index-scripts/init.js';

// Define variables 
let map;
let panorama;
let path = [];
let oldPath = [];
let polyline;
let marker;
let isStreetViewActive = false;

// Rename document objects
const mapElement = document.getElementById('map');
const streetViewButton = document.getElementById('streetViewButton');
const latitudeText = document.getElementById('latitude');
const longitudeText = document.getElementById('longitude');
const dateText = document.getElementById('date');
const timeText = document.getElementById('time');

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

getServerOwner();

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
    map = new google.maps.Map(mapElement, {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false
    });

    // Build polyline
    polyline = new google.maps.Polyline({
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
    });
    polyline.setMap(map);

    // Update street view data
    panorama = new google.maps.StreetViewPanorama(mapElement, {
        position: { lat: 10.98, lng: -74.81 },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        visible: false,
        fullscreenControl: false
    });

    map.setStreetView(panorama);

    streetViewButton.addEventListener('click', toggleStreetView);

    loadLastLocation();

    // Enable street view button
    streetViewButton.style.display = 'block';
    streetViewButton.disabled = false;

    setInterval(fetchLatestData, 100);
}

window.initMap = initMap;

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

    latitudeText.textContent = data.latitude;
    longitudeText.textContent = data.longitude;
    dateText.textContent = formattedDate;
    timeText.textContent = data.time;
}

// Toggle street view/map view
function toggleStreetView() {
    isStreetViewActive = !isStreetViewActive;
    panorama.setVisible(isStreetViewActive);
    if (!isStreetViewActive) {
        map.setCenter(marker.getPosition());
        streetViewButton.innerText = 'Street View';
    } else{
        streetViewButton.innerText = 'Map View';
    }
}
