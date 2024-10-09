import { clearMap } from '../records.js';
import { map, markers, polylines } from './init.js';

// Define variables
let startTime = null;
let endTime = null;
let paths = [];


const startInput = document.getElementById('startDateTime');
const endInput = document.getElementById('endDateTime');
const timeFilterBtn = document.getElementById('timeFilterBtn');
const pathSelectorContainer = document.getElementById('pathSelector');
const positionControl = document.getElementById('positionControl');

//Time filtring
export function timeFiltering(){
    timeFilterBtn.addEventListener('click', function (e) {
        e.preventDefault();

        // Message if time frame not selected
        if (!startInput.value || !endInput.value) {
            Swal.fire({
                text: 'Please set a time frame',
                icon: 'error',
                iconColor: '#6309CE',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#6309CE',
                customClass: {
                    popup: 'swal2-custom-font',
                    icon: 'swal2-icon-info-custom'
                }
            });
            return;
        }

        clearMap();
        paths = [];

        pathSelectorContainer.style.display = 'none';
        positionControl.style.display = 'block';


        startTime = convertToDatabaseFormat(startInput.value);
        endTime = convertToDatabaseFormat(endInput.value);

        // Request time filtered data to server
        fetch(`/api/filterDataByTime?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
            .then(response => response.json())
            .then(data => {
                
                // Process data and update map
                if (data.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    let currentPath = [];
                    let previousTime = null;
                    let lastPoint = null;
                    let startTimePath = null;
                    let endTimePath = null;

                    // Separate data in paths
                    data.forEach(point => {
                        const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };

                        const currentTimeString = `${point.date.split('T')[0]}T${point.time}`;
                        const currentTime = new Date(currentTimeString);

                        // Inicialize comparation variables
                        let timeDifference = 0;
                        let distance = 0;

                        if (previousTime) {
                            timeDifference = (currentTime - previousTime) / 1000; 
                        }

                        if (lastPoint) {
                            distance = google.maps.geometry.spherical.computeDistanceBetween(
                                new google.maps.LatLng(lastPoint.lat, lastPoint.lng),
                                new google.maps.LatLng(latLng.lat, latLng.lng)
                            );
                        }

                        // Crate new path if time differences > 60 or distance > 1000
                        if (timeDifference > 60 || distance > 1000) {
                            if (currentPath.length > 0) {
                                paths.push({ path: currentPath, startTimePath: startTimePath, endTimePath: endTimePath });
                            }
                            currentPath = [];
                        }

                        if (!currentPath.length) {
                            startTimePath = currentTime; 
                        }

                        endTimePath = currentTime; 
                        previousTime = currentTime; 
                        currentPath.push(latLng); 
                        bounds.extend(latLng); 
                        lastPoint = latLng;         
                    });

                    // Add data to paths
                    if (currentPath.length > 0) {
                        paths.push({ path: currentPath, startTimePath: startTimePath, endTimePath: endTimePath });
                    }

                    // Print polylines
                    paths.forEach((path, index) => {
                        const polyline = new google.maps.Polyline({
                            path: paths[index].path,
                            strokeColor: '#6309CE',
                            strokeOpacity: 1.0,
                            strokeWeight: 5,
                            icons: [{
                                icon: {
                                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                    scale: 3,
                                    strokeColor: '#6309CE',
                                    strokeWeight: 2,
                                    fillColor: '#6309CE',
                                    fillOpacity: 1.0,
                                },
                                offset: '100%',
                                repeat: '100px'
                            }]
                        });

                        polyline.setMap(map);
                        polylines.push(polyline);

                        markers.push(new google.maps.Marker({
                            position: paths[index].path[0], 
                            map: map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 5,
                                fillColor: "#C3AAff",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "#6309CE"
                            },
                            title: `Start of Path ${index + 1}`
                        }));

                        markers.push(new google.maps.Marker({
                            position: paths[index].path[path.length - 1], 
                            map: map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 5,
                                fillColor: "#C3AAff",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "#6309CE"
                            },
                            title: `End of Path ${index + 1}`
                        }));
                    });

                    map.fitBounds(bounds);

                } else {
                    // Print warning if no data was found
                    Swal.fire({
                        text: 'No data found in the specified time frame.',
                        icon: 'info',
                        iconColor: '#6309CE',
                        confirmButtonText: 'Accept',
                        confirmButtonColor: '#6309CE',
                        customClass: {
                            popup: 'swal2-custom-font',
                            icon: 'swal2-icon-info-custom'
                        }
                    });
                }
            })
            .catch(error => {
                clearMap();
                
                // Print warning if error filtering data
                Swal.fire({
                    text: 'Error getting filtered data: ' + error,
                    icon: 'error',
                    iconColor: '#6309CE',
                    confirmButtonText: 'Accept',
                    confirmButtonColor: '#6309CE',
                    customClass: {
                        popup: 'swal2-custom-font',
                        icon: 'swal2-icon-info-custom'
                    }
                });
                console.error('Error getting filtered data: ', error);
            });
    });
}