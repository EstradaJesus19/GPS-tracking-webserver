let map; 
let markers = [];
let polylines = [];
let paths = [];
let circle = null;
let isSelectingLocation = false;
let selectedPosition = null;

fetch('/api/getOwner')
    .then(response => response.json())
    .then(data => {
        document.title = `Real time - ${data.owner}`;
    })
    .catch(error => console.error('Error fetching owner:', error));

function loadGoogleMapsApi(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=maps,marker&v=beta`;
    script.async = true;
    document.head.appendChild(script);
}

fetch('/api/getApiKey')
    .then(response => response.json())
    .then(data => {
        loadGoogleMapsApi(data.apiKey);
    })
    .catch(error => {
        console.error('Error getting API Key:', error);
    });

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
    });
}

document.getElementById('timeFilterBtn').addEventListener('click', function (e) {
    const startInput = document.getElementById('startDateTime');
    const endInput = document.getElementById('endDateTime');

    e.preventDefault();

    const startTime = convertToDatabaseFormat(startInput.value);
    const endTime = convertToDatabaseFormat(endInput.value);

    fetch(`/api/filterData?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
        .then(response => response.json())
        .then(data => {
            clearMap();

            if (data.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                paths = separatePathsByTime(data);  // Separar por intervalos de tiempo

                paths.forEach(path => {
                    const polyline = new google.maps.Polyline({
                        path: path,
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

                    path.forEach(point => {
                        bounds.extend(point);
                    });

                    // Añadir marcadores en el inicio y final de cada path
                    addStartEndMarkers(path[0], path[path.length - 1]);
                });

                map.fitBounds(bounds);
            } else {
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

function convertToDatabaseFormat(dateTimeStr) {
    const [day, month, yearTime] = dateTimeStr.split('-');
    const [year, time] = yearTime.split(' ');
    return `${year}-${month}-${day} ${time}`;
}

function separatePathsByTime(data) {
    const timeThreshold = 60000; // 1 minuto en milisegundos
    let paths = [];
    let currentPath = [];

    data.forEach((point, index) => {
        const latLng = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };
        const currentTime = new Date(point.timestamp).getTime();

        if (currentPath.length === 0) {
            currentPath.push(latLng);
        } else {
            const previousTime = new Date(data[index - 1].timestamp).getTime();
            if (currentTime - previousTime > timeThreshold) {
                // Si ha pasado más de un minuto, comienza un nuevo path
                paths.push(currentPath);
                currentPath = [];
            }
            currentPath.push(latLng);
        }
    });

    if (currentPath.length > 0) {
        paths.push(currentPath); // Añadir el último path si existe
    }

    return paths;
}

function addStartEndMarkers(start, end) {
    // Añadir marcador de inicio
    markers.push(new google.maps.Marker({
        position: start,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: "#C3AAff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#6309CE"
        },
        title: "Start"
    }));

    // Añadir marcador de fin
    markers.push(new google.maps.Marker({
        position: end,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: "#C3AAff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#6309CE"
        },
        title: "End"
    }));
}

function clearMap() {
    polylines.forEach(polyline => {
        polyline.setMap(null);
    });
    polylines = [];

    clearMarkers();
    if (circle) {
        circle.setMap(null); 
        circle = null; 
    }
    paths = []; 
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}
