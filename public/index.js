let map;
let marker;
let polyline;
let directionsService;
let directionsRenderer;
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

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
    });

    fetch('/api/getLatestData')
        .then(response => response.json())
        .then(data => {
            if (data) {
                const position = {
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude)
                };

                path.push(position);
                updateMarkerAndInfo(data.latitude, data.longitude, data);
            }
        })
        .catch(error => console.error('Error fetching data:', error));

    setInterval(fetchLatestData, 100);

    fetch('/api/getOwner')
        .then(response => response.json())
        .then(data => {
            document.getElementById('owner').textContent = data.owner;
        })
        .catch(error => console.error('Error fetching owner:', error));
}

function fetchLatestData() {
    fetch('/api/getLatestData')
        .then(response => response.json())
        .then(data => {
            if (data) {
                const position = {
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude)
                };

                const lastPosition = path.length > 0 ? path[path.length - 1] : null;
                if (!lastPosition || lastPosition.lat !== position.lat || lastPosition.lng !== position.lng) {
                    path.push(position);
                    updateMarkerAndInfo(data.latitude, data.longitude, data);
                    smoothPolyline(path);
                }
            }
        })
        .catch(error => console.error('Error fetching latest data:', error));
}

function smoothPolyline(path) {
    if (path.length < 2) return;

    const start = path[path.length - 2];
    const end = path[path.length - 1];

    directionsService.route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
        } else {
            console.error('Error fetching directions:', status);
        }
    });
}

function updateMarkerAndInfo(lat, lng, data) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    if (marker) {
        marker.setMap(null); 
    }

    const icon = {
        url: 'media/favicon.svg', 
        scaledSize: new google.maps.Size(40, 40), 
        anchor: new google.maps.Point(20, 35) 
    };

    marker = new google.maps.Marker({
        position,
        map,
        title: `Lat: ${lat}, Lng: ${lng}`,
        icon: icon
    });

    map.setCenter(position);

    const date = new Date(data.date);
    const formattedDate = date.toISOString().split('T')[0]; 

    document.getElementById('latitude').textContent = data.latitude;
    document.getElementById('longitude').textContent = data.longitude;
    document.getElementById('date').textContent = formattedDate;
    document.getElementById('time').textContent = data.time;
}