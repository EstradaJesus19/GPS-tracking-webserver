import { map, polyline, panorama } from './init.js';
import { updateFuelGauge, updateSpeedGauge, updateRPMGauge } from './car-variables.js';

let paths = {};
let markers = {};

const checkboxes = document.querySelectorAll('.dropdownContent input[type="checkbox"]');

function getSelectedVehicleIds() {
    const selectedIds = [];
    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            selectedIds.push(index + 1); // Asume que el ID del vehículo es index + 1 (Vehicle 1 = ID 1)
        }
    });
    return selectedIds;
}

export function loadLastLocations() {
    const selectedVehicleIds = getSelectedVehicleIds();
    fetch(`/api/getDataByVehicleIds`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleIds: selectedVehicleIds })
    })
        .then(response => response.json())
        .then(data => {
            data.forEach(vehicleData => {
                const vehicleId = vehicleData.vehicles_id;
                if (!paths[vehicleId]) {
                    paths[vehicleId] = [];
                }
                const position = { lat: parseFloat(vehicleData.latitude), lng: parseFloat(vehicleData.longitude) };
                paths[vehicleId].push(position);
                updateMarkerAndPolyline(vehicleId, position, vehicleData);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

function updateMarkerAndPolyline(vehicleId, position, data) {
    if (markers[vehicleId]) {
        markers[vehicleId].setMap(null);
    }

    const icon = {
        url: 'media/favicon.svg',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 35)
    };

    markers[vehicleId] = new google.maps.Marker({
        position,
        map,
        title: `Vehicle ID: ${vehicleId}`,
        icon: icon
    });

    if (!polyline[vehicleId]) {
        polyline[vehicleId] = new google.maps.Polyline({
            map,
            path: paths[vehicleId],
            strokeColor: getColorByVehicleId(vehicleId),
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    } else {
        polyline[vehicleId].setPath(paths[vehicleId]);
    }

    map.setCenter(position);
}

function getColorByVehicleId(vehicleId) {
    const colors = ['#6309ce', '#c3aaff', '#ffa500']; // Define más colores según sea necesario
    return colors[vehicleId % colors.length];
}

