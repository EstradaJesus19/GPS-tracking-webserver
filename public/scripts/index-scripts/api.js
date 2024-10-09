import { initMap } from './map.js';
import { initStreetView } from './streetView.js';

export function loadLastLocation() {
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
        .catch(error => console.error('Error fetching data:', error));
}

export function getApiKeyAndLoadMap() {
    fetch('/api/getApiKey')
        .then(response => response.json())
        .then(data => {
            loadGoogleMapsApi(data.apiKey);
        })
        .catch(error => console.error('Error getting API key:', error));
}

export function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=maps,marker&v=beta`;
    script.async = true;
    document.head.appendChild(script);
}
