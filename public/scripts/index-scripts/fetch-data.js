import { map } from './init.js';
import { updateGauges, updateVehicleData } from './car-variables.js';

export const vehiclePaths = {};

const polylineColors = {
    1: '#6309CE',
    2: '#c3aaff'
};
export function loadLastLocation(vehicleId) {
    fetch(`/api/getDataForVehicle/${vehicleId}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];
                const initialPosition = {
                    lat: parseFloat(latestData.latitude),
                    lng: parseFloat(latestData.longitude)
                };

                if (!vehiclePaths[vehicleId]) {
                    vehiclePaths[vehicleId] = { path: [], polyline: null, marker: null };
                }

                vehiclePaths[vehicleId].path.push(initialPosition);

                if (!vehiclePaths[vehicleId].polyline) {
                    vehiclePaths[vehicleId].polyline = new google.maps.Polyline({
                        strokeColor: polylineColors[vehicleId] || '#000000', 
                        strokeOpacity: 1.0,
                        strokeWeight: 5,
                        map: map
                    });
                }

                updateMarkerAndInfo(vehicleId, latestData.latitude, latestData.longitude, latestData);
                updateVehicleData(latestData); 
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

export function fetchLatestData(vehicleId) {
    fetch(`/api/getDataForVehicle/${vehicleId}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];
                const lastPosition = vehiclePaths[vehicleId].path.length > 0 
                    ? vehiclePaths[vehicleId].path[vehiclePaths[vehicleId].path.length - 1] 
                    : null;

                if (!lastPosition || lastPosition.lat !== parseFloat(latestData.latitude) || lastPosition.lng !== parseFloat(latestData.longitude)) {
                    const position = {
                        lat: parseFloat(latestData.latitude),
                        lng: parseFloat(latestData.longitude)
                    };

                    vehiclePaths[vehicleId].path.push(position);
                    updatePolyline(vehicleId);
                    updateMarkerAndInfo(vehicleId, latestData.latitude, latestData.longitude, latestData);
                    updateVehicleData(latestData); 
                }
            }
        })
        .catch(error => console.error('Error fetching latest data:', error));
}

function updatePolyline(vehicleId) {
    if (vehiclePaths[vehicleId] && vehiclePaths[vehicleId].polyline) {
        vehiclePaths[vehicleId].polyline.setPath(vehiclePaths[vehicleId].path);
    }
}

function updateMarkerAndInfo(vehicleId, lat, lng, data) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    if (!vehiclePaths[vehicleId]) {
        vehiclePaths[vehicleId] = { path: [], polyline: null, marker: null };
    }

    if (vehiclePaths[vehicleId].marker) {
        vehiclePaths[vehicleId].marker.setPosition(position);
    } else {
        const icon = {
            url: 'media/favicon.svg',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 35)
        };

        vehiclePaths[vehicleId].marker = new google.maps.Marker({
            position,
            map,
            title: `Lat: ${lat}, Lng: ${lng}`,
            icon: icon
        });
    }
}
