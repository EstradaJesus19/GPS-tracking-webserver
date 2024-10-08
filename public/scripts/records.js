import { getApiOwner, getApiKey } from "./records-scripts/init.js";
import { linkCalendars } from "./records-scripts/calendars.js";
import { timeFiltering } from "./records-scripts/time-filtering.js";
import { positionFiltering } from "./records-scripts/position-filtering.js";

// Init page
getApiOwner();
getApiKey();
linkCalendars();

// Filter by time
timeFiltering();

// Filter by position
positionFiltering();