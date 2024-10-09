export let map;
export let polyline;
let mapElement = document.getElementById('map');

export function initMap() {
    map = new google.maps.Map(mapElement, {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false
    });

    polyline = new google.maps.Polyline({
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
    });
    polyline.setMap(map);
}
