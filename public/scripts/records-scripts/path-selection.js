import { map, markers, polylines } from "./init.js";
import { clearPolylines, clearMarkers } from './clear-options.js';
import { usedPaths } from "./position-filtering.js";
import { enableCarVariables, disableCarVariables, updateFuelGauge, updateRPMGauge, updateSpeedGauge } from './car-variables.js';

// Define variables
let currentPathIndex = 0;
let currentPointIndex = 0;
let pathOptionsVisible = true;
let isPlaying = false;  
let playIntervalId = null;
let currentVelocity = 200; 

const pathSelectorContainer = document.getElementById('pathSelector');
const pathButtonsContainer = document.getElementById('pathButtons');
const hiderPath = document.getElementById('hiderPath');
const pathOptions = document.getElementById('pathOptions');
const pointDate = document.getElementById('pointDate');
const pointTime = document.getElementById('pointTime');
const previousPoint = document.getElementById('previousPoint');
const nextPoint = document.getElementById('nextPoint');
const playPoint = document.getElementById('playPoint');
const velocityPoint = document.getElementById('velocityPoint')
const velocityDisplay = document.getElementById('velocity');
const playOption = document.getElementById('play');
const vehiclePathSelector = document.getElementById('vehiclePathSelector');

const polylineColors = {
    "1": "#6309CE",
    "2": "#a80aa8"
};

const urls = {
    1: 'media/marker1.svg',
    2: 'media/marker2.svg'
};

function showPathContainer() {
    pathOptions.classList.add("visible");
    hiderPath.classList.add("collapsed");
}

function hidePathContainer() {
    pathOptions.classList.remove("visible");
    hiderPath.classList.remove("collapsed");
}

export function pathContainerHider() {
    hiderPath.addEventListener("click", function() {
        pathOptionsVisible = !pathOptionsVisible;
        pathOptionsVisible ? showPathContainer() : hidePathContainer();
    });
}

vehiclePathSelector.addEventListener('change', () => {
    const selectedVehicle = vehiclePathSelector.value; 
    const vehiclePaths = usedPaths.filter(path => path.vehicleId === selectedVehicle); 
    console.log(vehiclePaths);
    createPathSelector(vehiclePaths); 
    selectPath(0, vehiclePaths);
    currentPathIndex = 0; 
    currentPointIndex = 0; 
});

// Create path selector
export function createPathSelector(paths) {
    pathButtonsContainer.innerHTML = ''; 

    if (paths.length === 0) {
        pathSelectorContainer.style.display = 'none';
        disableCarVariables();
        return;
    }

    pathSelectorContainer.style.display = 'block'; 
    enableCarVariables();

    paths.forEach((pathInfo, index) => {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex'; 
        buttonContainer.style.alignItems = 'center';

        const button = document.createElement('button');
        button.className = 'pathButton';
        button.id = `pathButton-${index}`;
        button.innerText = `Path ${index + 1}`;
        button.onclick = () => selectPath(index, paths);

        // Format date and time for UX
        const startDate = new Date(pathInfo.startTimePath);
        const endDate = new Date(pathInfo.endTimePath);

        function formatDateAndTime(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = date.getDate();
            const month = months[date.getMonth()]; 
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0'); 
            const minutes = date.getMinutes().toString().padStart(2, '0'); 

            return `${day} ${month} ${year} at ${hours}:${minutes}`;
        }

        const startTimeFormatted = formatDateAndTime(startDate);
        const endTimeFormatted = formatDateAndTime(endDate);

        button.setAttribute('data-tippy-content', `${startTimeFormatted} to ${endTimeFormatted}`);

        buttonContainer.appendChild(button);
        pathButtonsContainer.appendChild(buttonContainer);
    });

    // Initialize Tippy.js in each path button
    tippy('.pathButton', {
        theme: 'light', 
        placement: 'top', 
        animation: 'scale',
        duration: [0, 0], 
        delay: [0, 0], 
        hideOnClick: true, 
        trigger: 'mouseenter focus', 
        interactive: true, 
        appendTo: document.body,
        maxWidth: '160px'
    });
}

// Set selected or not selected button class
function SelectButtonOrNo(index) {
    const allButtons = document.querySelectorAll('#pathButtons .pathButton');
    allButtons.forEach(button => button.classList.remove('selected'));

    const selectedButton = document.getElementById(`pathButton-${index}`);
    selectedButton.classList.add('selected');
}

// Select path
export function selectPath(index, paths) {
    SelectButtonOrNo(index); 
    clearPolylines();
    clearMarkers(); 

    if (isPlaying) {
        playOption.click();
    }

    currentPathIndex = index;
    currentPointIndex = 0;

    updatePointData(paths);

    const selectedVehicle = vehiclePathSelector.value;
    const vehicleColor = polylineColors[selectedVehicle] || '#6309CE';

    const polyline = new google.maps.Polyline({
        path: paths[index].path,
        strokeColor: vehicleColor,
        strokeOpacity: 1.0,
        strokeWeight: 5,
        icons: [{
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: vehicleColor,
                strokeWeight: 2,
                fillColor: vehicleColor,
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
            strokeColor: vehicleColor
        },
        title: `Start of path ${index + 1}`
    }));

    markers.push(new google.maps.Marker({
        position: paths[index].path[paths[index].path.length - 1],
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: "#C3AAff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: vehicleColor
        },
        title: `End of path ${index + 1}`
    }));

    updateMarkerPosition(paths[currentPathIndex].path[currentPointIndex]);
}

function formatDateAndTimeControl(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return { day, month, year, hours, minutes, seconds };
}

function updatePointData(paths) {
    const metadata = paths[currentPathIndex].metadata[currentPointIndex];
    const [dateTime, vel, rpm, fuel] = metadata.split('|');
    
    const formattedDateTime = formatDateAndTimeControl(new Date(dateTime));
    
    pointDate.textContent = `${formattedDateTime.day}-${formattedDateTime.month}-${formattedDateTime.year}`;
    pointTime.textContent = `${formattedDateTime.hours}:${formattedDateTime.minutes}:${formattedDateTime.seconds}`;
    
    updateSpeedGauge(vel);
    updateRPMGauge(rpm);
    updateFuelGauge(fuel);
    
    updateButtonStates(paths);
}

let intervalId = null;

function startHolding(action) {
    action();
    intervalId = setInterval(action, 200);
}

function stopHolding() {
    clearInterval(intervalId);
    intervalId = null;
}

function updateButtonStates(paths) {
    if (currentPointIndex === 0) {
        previousPoint.disabled = true;
        previousPoint.style.cursor = 'not-allowed';
        previousPoint.style.opacity = 0.5;
    } else {
        previousPoint.disabled = false;
        previousPoint.style.cursor = 'pointer';
        previousPoint.style.opacity = 1;
    }

    if (currentPointIndex === paths[currentPathIndex].path.length - 1) {
        nextPoint.disabled = true;
        nextPoint.style.cursor = 'not-allowed';
        nextPoint.style.opacity = 0.5;
    } else {
        nextPoint.disabled = false;
        nextPoint.style.cursor = 'pointer';
        nextPoint.style.opacity = 1;
    }
}

function previousAction() {
    if (currentPointIndex > 0) {
        currentPointIndex--;
        updatePointData(usedPaths);
        updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
        updateButtonStates(usedPaths); 
    }
}

function nextAction() {
    if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
        currentPointIndex++;
        updatePointData(usedPaths);
        updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
        updateButtonStates(usedPaths); 
    }
}

previousPoint.addEventListener('mousedown', () => {
    startHolding(previousAction);
});

previousPoint.addEventListener('mouseup', stopHolding);
previousPoint.addEventListener('mouseleave', stopHolding);

nextPoint.addEventListener('mousedown', () => {
    startHolding(nextAction);
});

nextPoint.addEventListener('mouseup', stopHolding);
nextPoint.addEventListener('mouseleave', stopHolding);

document.addEventListener('keydown', (event) => {
    if (pathSelectorContainer.style.display == 'block') {
        if (event.key === 'ArrowLeft') {
            previousAction();
        } else if (event.key === 'ArrowRight') {
            nextAction();
        }
    }
});

function updateMarkerPosition(latLng) {
    const selectedVehicle = vehiclePathSelector.value;
    const icon = {
        url: urls[selectedVehicle],
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 35)
    };

    if (markers.length > 2) {
        markers[markers.length - 1].setPosition(latLng); 
    } else {
        markers.push(new google.maps.Marker({
            position: latLng,
            map: map,
            icon: icon,
            title: `Path ${currentPathIndex + 1}`
        }));
    }
}

playPoint.addEventListener('click', togglePlayPause);

document.addEventListener('keydown', (event) => {
    if (pathSelectorContainer.style.display == 'block') {
        if (event.code === 'Space') {
            event.preventDefault(); 
            togglePlayPause();
        }
    }
    
});

function togglePlayPause() {
    if (!isPlaying) {
        if (currentPointIndex === usedPaths[currentPathIndex].path.length - 1) {
            currentPointIndex = 0;
        }

        playOption.src = 'media/pause.svg';
        isPlaying = true;

        playIntervalId = setInterval(() => {
            if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
                currentPointIndex++;
                updatePointData(usedPaths);
                updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
                updateButtonStates(usedPaths);
            } else {
                clearInterval(playIntervalId);
                isPlaying = false;
                playOption.src = 'media/play.svg';
            }
        }, currentVelocity);
    } else {
        clearInterval(playIntervalId);
        isPlaying = false;
        playOption.src = 'media/play.svg';
    }
}

velocityPoint.addEventListener('click', () => {
    if (currentVelocity === 200) {
        currentVelocity = 100;
        velocityDisplay.textContent = 'x2';
    } else {
        currentVelocity = 200;
        velocityDisplay.textContent = 'x1';
    }

    if (isPlaying) {
        clearInterval(playIntervalId);
        playIntervalId = setInterval(() => {
            if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
                currentPointIndex++;
                updatePointData(usedPaths);
                updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
                updateButtonStates(usedPaths);
            } else {
                clearInterval(playIntervalId);
                isPlaying = false;
                playOption.src = 'media/play.svg';
            }
        }, currentVelocity);
    }
});
