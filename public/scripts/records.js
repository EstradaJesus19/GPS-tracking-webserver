let map;
let polyline;
let path = [];

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
        console.error('Error al obtener la API Key:', error);
    });

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 10.98, lng: -74.81 },
        zoom: 13,
    });

    polyline = new google.maps.Polyline({
        strokeColor: '#6309CE',
        strokeOpacity: 1.0,
        strokeWeight: 5,
    });
    polyline.setMap(map);
}

document.getElementById('filter-btn').addEventListener('click', () => {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (startDate && endDate) {
        fetch(`/api/getAllData?start=${startDate}&end=${endDate}`)
            .then(response => response.json())
            .then(data => {
                path = data.map(entry => ({
                    lat: parseFloat(entry.latitude),
                    lng: parseFloat(entry.longitude),
                }));
                polyline.setPath(path);
            })
            .catch(error => console.error('Error fetching filtered data:', error));
    } else {
        alert('Please select both start and end dates.');
    }
});
