import { map } from './map.js';

export let panorama;
let isStreetViewActive = false;
const streetViewButton = document.getElementById('streetViewButton');

export function initStreetView() {
    panorama = new google.maps.StreetViewPanorama(document.getElementById('map'), {
        position: { lat: 10.98, lng: -74.81 },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        visible: false,
        fullscreenControl: false
    });

    map.setStreetView(panorama);

    streetViewButton.addEventListener('click', toggleStreetView);
}

export function toggleStreetView() {
    isStreetViewActive = !isStreetViewActive;
    panorama.setVisible(isStreetViewActive);
    streetViewButton.innerText = isStreetViewActive ? 'Map View' : 'Street View';
}
