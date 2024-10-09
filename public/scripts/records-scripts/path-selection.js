import { map, markers, polylines } from "./init.js";
import { clearPolylines, clearMarkers } from './clear-options.js';
import { usedPaths } from "./position-filtering.js";

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

export function pathContaierHider() {
    hiderPath.addEventListener("click", function() {
        pointDate.disabled = true;
        pointTime.disabled = true;

        if (pathOptionsVisible) {
            pathOptionsVisible = !pathOptionsVisible;
            pathOptions.classList.remove("visible");
            hiderPath.classList.remove("collapsed");
            
        } else {
            pathOptionsVisible = !pathOptionsVisible;
            pathOptions.classList.add("visible");
            hiderPath.classList.add("collapsed");
        }
    });
}

// Create path selector
export function createPathSelector(paths) {
    pathButtonsContainer.innerHTML = ''; 

    if (paths.length === 0) {
        pathSelectorContainer.style.display = 'none';
        return;
    }
    pathSelectorContainer.style.display = 'block'; 
    pointDate.disabled = true;
    pointTime.disabled = true;

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

    updateDateTime(paths);

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
            strokeColor: "#6309CE"
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
        if (currentPointIndex === usedPaths[currentPathIndex].path.length - 1) {
            currentPointIndex = 0;
        }

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
