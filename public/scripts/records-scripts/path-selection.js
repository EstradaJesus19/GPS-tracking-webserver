import { map, markers, polylines } from "./init.js";
import { clearPolylines, clearMarkers } from './clear-options.js';

// Define variables
let pathOptionsVisible = true;

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