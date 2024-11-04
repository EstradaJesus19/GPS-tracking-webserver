import { getApiOwner, getApiKey } from "./records-scripts/init.js";
import { linkCalendars } from "./records-scripts/calendars.js";
import { timeFiltering } from "./records-scripts/time-filtering.js";
import { positionFiltering } from "./records-scripts/position-filtering.js";
import { manageCarDataVisibility, selectVehicles } from "./records-scripts/car-variables.js";

// Init page
getApiOwner();
getApiKey();
linkCalendars();

// Filter by time
timeFiltering();

// Filter by position
positionFiltering();

//Car variables
manageCarDataVisibility();

document.addEventListener("DOMContentLoaded", () => {
    selectVehicles();
});