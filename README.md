![Trackit](public/media/TrackIt.svg)

# TrackIT README

## Project Overview

TrackIT is a Node.js-based server designed to manage the locations of a vehicle. It connects to a MySQL database where historical location data is stored. The project also includes two web pages that facilitate real-time tracking and historical data analysis.

## Technologies Used

- **Node.js** (Server)
- **MySQL** (Database)
- **HTML, CSS, JavaScript** (Web Pages)

## Features

- **Real-time Tracking:** View the vehicle's position on a map, with options to switch between map view and street view.
- **Historical Data Review:** Filter historical data by selecting a specific time frame and interactively refining results using latitude, longitude, and radius.
- **Animated Path Replay:** Replay the vehicle's paths with animation for a more engaging experience.

## Usage

### Real-time Tracking

1. Open a web browser and navigate to [http://trackit01.ddns.net](http://trackit01.ddns.net), [http://trackit02.ddns.net](http://trackit02.ddns.net) or [http://trackit03.ddns.net](http://trackit03.ddns.net).
2. The map will display the vehicle's current location. You can toggle between map view and street view using the provided buttons.
3. The webpage will automatically refresh with new location data in real-time and show the path built since the last page refresh.

### Historical Data Review

1. On the last web page, switch to records section (top right).
2. Use the date and time pickers to select a time frame for filtering historical data.
3. Apply the interactive filter to refine the data by position, utilizing latitude, longitude, and radius.
4. Use the interactive control for seeing each point of every path shown.
