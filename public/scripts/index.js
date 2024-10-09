// index.js
import { initMap } from './map.js';
import { initStreetView } from './streetView.js';
import { getApiKeyAndLoadMap, loadLastLocation } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    getApiKeyAndLoadMap();
    initStreetView();
    loadLastLocation();
});
