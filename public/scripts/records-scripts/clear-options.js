import { markers, polylines } from ".init.js";
import { circle } from "./position-filtering.js";


// Clear map
export function clearMap() {
    clearCircles();
    clearMarkers();
    clearPolylines();
}

// Clear markers
export function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers.length = 0;
}

// Clear circles
export function clearCircles() {
    if (circle) {
        circle.setMap(null);
    }
}

// Clear polylines
export function clearPolylines() {
    polylines.forEach(polyline => {
         polyline.setMap(null);
    });
    polylines.length = 0;
}