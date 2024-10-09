import { map, polyline } from './map.js';
import { panorama } from './streetView.js';

let marker;
const latitudeText = document.getElementById('latitude');
const longitudeText = document.getElementById('longitude');
const dateText = document.getElementById('date');
const timeText = document.getElementById('time');

export function updateMarkerAndInfo(lat, lng, data) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    if (marker) {
        marker.setMap(null);
    }

    marker = new google.maps.Marker({
        position,
        map,
        title: `Lat: ${lat}, Lng: ${lng}`,
        icon: {
            url: 'media/favicon.svg',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 35)
        }
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
