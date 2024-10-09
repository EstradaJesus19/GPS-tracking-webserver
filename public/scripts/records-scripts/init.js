// Define variables
export let map; 
export let polyline;
export let polylines = [];
export var markers = [];

const mapElement = document.getElementById('map');

// Get server owner and print it in the web page tittle
export function getApiOwner() {
    fetch('/api/getOwner')
        .then(response => response.json())
        .then(data => {
            document.title = `Records - ${data.owner}`;
        })
        .catch(error => console.error('Error fetching owner:', error));
}

// Get APIKEY and load map API
export function getApiKey() {
fetch('/api/getApiKey')
    .then(response => response.json())
    .then(data => {
        loadGoogleMapsApi(data.apiKey);
    })
    .catch(error => {
        console.error('Error getting API Key:', error);
    });
}

// Load Google Maps API
function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&loading=async&libraries=maps,marker&v=beta`;
    script.async = true;
    document.head.appendChild(script);
}

// Init map
function initMap() {
    map = new google.maps.Map(mapElement, {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false
    });

    // Define polyline features
    polyline = new google.maps.Polyline({
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        icons: [{
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: '#6309CE',
                strokeWeight: 2,
                fillColor: '#6309CE',
                fillOpacity: 1.0,
            },
            offset: '100%',
            repeat: '100px'
        }]
    });

    polyline.setMap(map);
}

window.initMap = initMap;