import { getApiOwner, getApiKey, map, markers, polylines } from "./records-scripts/init.js";
import { linkCalendars } from "./records-scripts/calendars.js";
import { timeFiltering } from "./records-scripts/time-filtering.js";
import { positionFiltering, usedPaths } from "./records-scripts/position-filtering.js";
import { currentPathIndex, currentPointIndex } from "./records-scripts/position-filtering.js";

// Define variables
let isPlaying = false;  
let playIntervalId = null;
let currentVelocity = 200; 

const pointDate = document.getElementById('pointDate');
const pointTime = document.getElementById('pointTime');
const previousPoint = document.getElementById('previousPoint');
const nextPoint = document.getElementById('nextPoint');
const playPoint = document.getElementById('playPoint');
const velocityPoint = document.getElementById('velocityPoint')
const velocityDisplay = document.getElementById('velocity');
const playOption = document.getElementById('play');

getApiOwner();
getApiKey();

//Filtering by time
linkCalendars();

// Filter by time
timeFiltering();

// Filter by position
positionFiltering();



function formatDateAndTimeControl(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return { day, month, year, hours, minutes, seconds };
}

function updateDateTime(paths) {
    const formattedDateTime  = formatDateAndTimeControl(new Date(paths[currentPathIndex].metadata[currentPointIndex]));
    
    pointDate.value = `${formattedDateTime.day}-${formattedDateTime.month}-${formattedDateTime.year}`;
    pointTime.value = `${formattedDateTime.hours}:${formattedDateTime.minutes}:${formattedDateTime.seconds}`;

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

previousPoint.addEventListener('mousedown', () => {
    startHolding(() => {
        if (currentPointIndex > 0) {
            currentPointIndex--;
            updateDateTime(usedPaths);
            updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
            updateButtonStates(usedPaths); 
        }
    });
});

previousPoint.addEventListener('mouseup', stopHolding);
previousPoint.addEventListener('mouseleave', stopHolding);

nextPoint.addEventListener('mousedown', () => {
    startHolding(() => {
        if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
            currentPointIndex++;
            updateDateTime(usedPaths);
            updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
            updateButtonStates(usedPaths); 
        }
    });
});

nextPoint.addEventListener('mouseup', stopHolding);
nextPoint.addEventListener('mouseleave', stopHolding);

function updateMarkerPosition(latLng) {
    const icon = {
        url: 'media/favicon.svg',
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
            title: `Point ${currentPointIndex + 1} of Path ${currentPathIndex + 1}`
        }));
    }
}

playPoint.addEventListener('click', () => {
    if (!isPlaying) {
        playOption.src = 'media/pause.svg';
        isPlaying = true;

        playIntervalId = setInterval(() => {
            if (currentPointIndex < usedPaths[currentPathIndex].path.length - 1) {
                currentPointIndex++;
                updateDateTime(usedPaths);
                updateMarkerPosition(usedPaths[currentPathIndex].path[currentPointIndex]);
                updateButtonStates(usedPaths);
            } else {
                clearInterval(playIntervalId);
                isPlaying = false;
                playOption.src = 'media/play.svg';
            }
        }, currentVelocity);
    } else {
        // Pausar la reproducción
        clearInterval(playIntervalId);
        isPlaying = false;
        playOption.src = 'media/play.svg';
    }
});

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
                updateDateTime(usedPaths);
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
