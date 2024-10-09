// index.js
import { initMap } from './index-scripts/map.js';
import { initStreetView } from './index-scripts/streetView.js';
import { getApiKeyAndLoadMap, loadLastLocation } from './index-scripts/api.js';

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    getApiKeyAndLoadMap();
    initStreetView();
    loadLastLocation();
});
