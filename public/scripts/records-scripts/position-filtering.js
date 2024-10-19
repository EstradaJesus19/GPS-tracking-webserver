import { map } from './init.js';
import { startTime, endTime } from './time-filtering.js';
import { clearMap, clearCircles, clearPolylines, clearMarkers } from './clear-options.js';
import { selectPath, createPathSelector, pathContainerHider } from './path-selection.js';

// Define variables
export let usedPaths = [];
export let circle = null;
let positionOptionsVisible = true;
let positionFilteringAction = false;
let selectedPosition = null;
let radius = null;
let isMouseDown = false;

const radiusInput = document.getElementById('radiusInput');
const latitudeInput = document.getElementById('latitudeInput');
const longitudeInput = document.getElementById('longitudeInput');
const toggleSwitch = document.getElementById('toggleSwitch');
const timeFilterBtn = document.getElementById('timeFilterBtn');
const positionOptions = document.getElementById('positionOptions');
const hiderPosition = document.getElementById('hiderPosition');
const infoBox = document.getElementById('infoBox');
const hiderContainerPosition = document.getElementById('hiderContainerPosition');

export function positionFiltering(){
    toggleSwitch.addEventListener("click", function() {
        if (positionFilteringAction) {
            positionFilteringAction = !positionFilteringAction;
            positionOptions.classList.remove("visible");
            
            hiderContainerPosition.classList.remove("visible");
            setTimeout(function() {
                hiderContainerPosition.style.display = 'none';
                hiderPosition.classList.add("collapsed");
            }, 200);

            disableMapClick();
            clearMap();

            timeFilterBtn.click();
        } else {
            positionOptions.classList.add("visible");
            positionFilteringAction = !positionFilteringAction;
            positionOptionsVisible = true;

            hiderContainerPosition.classList.add("visible");
            setTimeout(function() {
                hiderContainerPosition.style.display = 'block';
            }, 200);
            
            
            enableMapClick();

            infoBox.style.display = "block";
            infoBox.style.opacity = 1;

            setTimeout(function() {
                infoBox.style.opacity = 0;
            }, 2000);

            setTimeout(function() {
                infoBox.style.display = "none"; 
            }, 3000); 
        }
    });

    radiusInput.addEventListener('change', function () {
        if (circle) {
            radius = parseFloat(radiusInput.value);
            circle.setRadius(radius);
        }
    });

    // Link radius input with map circle
    radiusInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            if (circle) {
                if (radiusInput.value <=500){
                    radiusInput.value = 500;
                }
                radius = parseFloat(radiusInput.value);
                circle.setRadius(radius);
            }
            
        }
    });

    hiderPosition.addEventListener("click", function() {
        if (positionOptionsVisible) {
            positionOptionsVisible = !positionOptionsVisible;
            positionOptions.classList.remove("visible");
            hiderPosition.classList.remove("collapsed");
            
        } else {
            positionOptionsVisible = !positionOptionsVisible;
            positionOptions.classList.add("visible");
            hiderPosition.classList.add("collapsed");
        }
    });

    pathContainerHider();
}

// Enable map click
function enableMapClick() {
    map.addListener('click', handleMapClick);
    map.setOptions({ draggableCursor: 'crosshair' });
}

// Disable map click
function disableMapClick() {
    google.maps.event.clearListeners(map, 'click');
    map.setOptions({ draggableCursor: 'null' });
}

// Manage clicking on map
function handleMapClick(event) {
    radius = parseFloat(radiusInput.value);
    selectedPosition = event.latLng;
    latitudeInput.textContent = selectedPosition.lat().toFixed(4);
    longitudeInput.textContent = selectedPosition.lng().toFixed(4);
    clearCircles();
    drawCircle(selectedPosition, radius, true);
    filterByPosition(radius, selectedPosition, startTime, endTime);
}

// Draw circle on map
function drawCircle(position, radius, isEditable) {
    circle = new google.maps.Circle({
        center: position,
        radius: radius,
        strokeColor: '#6309CE',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: '#C3AAff',
        fillOpacity: 0.25,
        map: map,
        geodesic: true,
        editable: isEditable,
        draggable: isEditable,
    });

    if (window.innerWidth >= 720) {
        google.maps.event.addListener(circle, 'radius_changed', function () {
            radius = Math.round(circle.getRadius());
            filterByPosition(radius, selectedPosition, startTime, endTime);
            radiusInput.value = radius;
        });

        google.maps.event.addListener(circle, 'mouseup', function () {
            selectedPosition = circle.getCenter();
            filterByPosition(radius, selectedPosition, startTime, endTime);
            latitudeInput.textContent = selectedPosition.lat().toFixed(4);
            longitudeInput.textContent = selectedPosition.lng().toFixed(4);
        });

        document.addEventListener('mouseup', function() {
            isMouseDown = false;
        });
    
        document.addEventListener('mousedown', function() {
            isMouseDown = true;
        });

        google.maps.event.addListener(circle, 'center_changed', function () {
            if  (!isMouseDown){
                selectedPosition = circle.getCenter();
                filterByPosition(radius, selectedPosition, startTime, endTime);
                latitudeInput.textContent = selectedPosition.lat().toFixed(4);
                longitudeInput.textContent = selectedPosition.lng().toFixed(4);
            }
        });
    } else{
        google.maps.event.addListener(circle, 'radius_changed', function () {
            radius = Math.round(circle.getRadius());
            filterByPosition(radius, selectedPosition, startTime, endTime);
            radiusInput.value = radius;
        });

        google.maps.event.addListener(circle, 'mouseup', function () {
            selectedPosition = circle.getCenter();
            filterByPosition(radius, selectedPosition, startTime, endTime);
            latitudeInput.textContent = selectedPosition.lat().toFixed(4);
            longitudeInput.textContent = selectedPosition.lng().toFixed(4);
        });
    }
}

function filterByPosition(radius, selectedPosition, startTime, endTime){
    // Print warning if position or radius aren't selected
    if (!selectedPosition || !radius) {
        Swal.fire({
            text: 'Please set a location and define a radius',
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

    const position = {
        latitude: selectedPosition.lat(),
        longitude: selectedPosition.lng(),
        radius: radius
    };

    // Request position filtered data to server
    fetch(`/api/filterDataByPosition?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&latitude=${position.latitude}&longitude=${position.longitude}&radius=${position.radius}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                let paths = []; 
                let currentPath = []; 
                let currentMetadata = [];
                let previousTime = null; 
                let startTimePath = null;
                let endTimePath = null;

                // Check received data
                data.forEach((point, index) => {
                    const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };

                    const currentTimeString = `${point.date.split('T')[0]}T${point.time}`; 
                    const currentTime = new Date(currentTimeString);
                    
                    // Compare time between data
                    if (previousTime) {
                        const timeDifference = (currentTime - previousTime) / 1000; 

                        if (timeDifference > 60) {
                            if (currentPath.length > 0) {
                                paths.push({ path: currentPath, metadata: currentMetadata, startTimePath: startTimePath, endTimePath: endTimePath }); 
                            }
                            currentPath = []; 
                            currentMetadata = [];
                        }
                    }

                    if (!currentPath.length) {
                        startTimePath = currentTime; 
                    }
                    endTimePath = currentTime; 
                    currentPath.push(latLng); 
                    currentMetadata.push(`${point.date.split('T')[0]}T${point.time}`); 
                    bounds.extend(latLng); 
                    previousTime = currentTime; 
                });

                if (currentPath.length > 0) {
                    paths.push({ path: currentPath, metadata: currentMetadata, startTimePath: startTimePath, endTimePath: endTimePath }); 
                }
                
                // Create windows for path selecting
                createPathSelector(paths);
                selectPath(0, paths);
                usedPaths = paths;

            } else {
                usedPaths.length = 0;
                clearPolylines();
                clearMarkers();
                createPathSelector(usedPaths);

                // Print warning that no data was found
                Swal.fire({
                    text: 'No data found in the specified area.',
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
            clearPolylines();
            clearMarkers();

            // Print warning if error filtering data
            Swal.fire({
                text: 'Error fetching filtered data: ' + error,
                icon: 'error',
                iconColor: '#6309CE',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#6309CE',
                customClass: {
                    popup: 'swal2-custom-font',
                    icon: 'swal2-icon-info-custom'
                }
            });
            console.error('Error fetching filtered data: ', error);
        });
}
