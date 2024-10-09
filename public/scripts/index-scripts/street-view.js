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
