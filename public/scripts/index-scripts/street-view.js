import { marker } from './fetch-data.js';
import { panorama, map } from './init.js';

// Define variables 
let isStreetViewActive = false;

const streetViewButton = document.getElementById('streetViewButton');

// Toggle street vie view
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
