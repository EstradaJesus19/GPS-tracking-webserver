import { fetchLatestData, loadLastLocation } from './fetch-data.js';
import { toggleStreetView } from './street-view.js';

// Define variables 
export let map;
export let panorama;
export let polyline;

// Rename document objects
const mapElement = document.getElementById('map');
const streetViewButton = document.getElementById('streetViewButton');

// Get server owner and print it in the web page tittle
export function getServerOwner(){
    fetch('/api/getOwner')
        .then(response => response.json())
        .then(data => {
            document.title = `Real time - ${data.owner}`;
        })
        .catch(error => console.error('Error fetching owner:', error));
}

// Get APIKEY and load map API
function getApiKey() {
    fetch('/api/getApiKey')
        .then(response => response.json())
        .then(data => {
            loadGoogleMapsApi(data.apiKey);
        })
        .catch(error => {
            console.error('Error getting API key:', error);
        });
}

// Load Google Maps API    
function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=maps,marker&v=beta`;
    script.async = true;
    document.head.appendChild(script);
}

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

export function mainProcess(){
    getServerOwner();
    getApiKey();
}

window.initMap = initMap;