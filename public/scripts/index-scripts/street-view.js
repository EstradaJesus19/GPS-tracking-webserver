import { panorama } from './init.js';

// Define variables 
let isStreetViewActive = false;

const streetViewButton = document.getElementById('streetViewButton');

// Toggle street view/map view
export function toggleStreetView() {
    isStreetViewActive = !isStreetViewActive;
    panorama.setVisible(isStreetViewActive);
    if (!isStreetViewActive) {
        map.setCenter(marker.getPosition());
        streetViewButton.innerText = 'Street View';
    } else{
        streetViewButton.innerText = 'Map View';
    }
}
