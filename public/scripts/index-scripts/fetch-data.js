import { map } from './init.js';
import { updateVehicleData, currentVehicleId } from './car-variables.js';

export const vehiclePaths = {};
export const lastVehicleData = {};

const polylineColors = {
    1: '#6309CE',
    2: '#a80aa8'
};

const urls = {
    1: 'media/marker1.svg',
    2: 'media/marker2.svg'
};

export function loadLastLocation(vehicleId) {
    fetch(`/api/getRealTimeData/${vehicleId}`)
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

                // Solo actualiza la pantalla si el vehículo corresponde al actual
                if (vehicleId === currentVehicleId) {
                    updateVehicleData(latestData);
                }
                
                lastVehicleData[vehicleId] = data;

                adjustMapView();
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

export function fetchLatestData(vehicleId) {
    fetch(`/api/getRealTimeData/${vehicleId}`)
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

                    // Solo actualiza la pantalla si el vehículo corresponde al actual
                    if (vehicleId === currentVehicleId) {
                        updateVehicleData(latestData);
                    }

                    adjustMapView();
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
            url: urls[vehicleId],
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

function adjustMapView() {
    const selectedVehicles = Object.keys(vehiclePaths)
        .filter(id => vehiclePaths[id].marker && vehiclePaths[id].marker.getMap());

    if (selectedVehicles.length === 1) {
        const vehicleId = selectedVehicles[0];
        const position = vehiclePaths[vehicleId].marker.getPosition();
        map.setCenter(position);
    }    
    // else if (selectedVehicles.length > 1) {
    //     const bounds = new google.maps.LatLngBounds();
    //     selectedVehicles.forEach(vehicleId => {
    //         const position = vehiclePaths[vehicleId].marker.getPosition();
    //         bounds.extend(position);
    //     });
    //     map.fitBounds(bounds);
    // }
}