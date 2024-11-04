import { vehiclePaths } from './fetch-data.js';

let carDataVisible = true;
let currentVehicleId = 1; 
const totalVehicles = 2;

const speedValueElement = document.getElementById("speedValue");
const gaugeContainer = document.querySelector(".gaugeContainer");
const rpmValueElement = document.getElementById("rpmValue");
const fuelContainer = document.getElementById("fuelContainer");
const vehicleName = document.getElementById("vehicleName");
const previousVehicleIcon = document.getElementById("previousVehicleIcon");
const nextVehicleIcon = document.getElementById("nextVehicleIcon");
const positionOptions = document.getElementById("positionOptions");
const hiderPosition = document.getElementById("hiderPosition");
const latitudeInput = document.getElementById('latitudeInput');
const longitudeInput = document.getElementById('longitudeInput');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');

function updateNavigationButtons() {
    previousVehicleIcon.disabled = currentVehicleId === 1;
    nextVehicleIcon.disabled = currentVehicleId === totalVehicles;
}

export function updateVehicleData(data) {
    vehicleName.textContent = `Vehicle ${data.vehicleId}`;
    latitudeInput.textContent = data.latitude || 'NA';
    longitudeInput.textContent = data.longitude || 'NA';
    const date = new Date(data.date);
    const formattedDate = date.toISOString().split('T')[0];
    dateInput.textContent = formattedDate || 'NA';
    timeInput.textContent = data.time || 'NA';
    updateGauges(data);
    updateNavigationButtons();
}

function updateVehicleDisplay() {
    const vehicleData = vehiclePaths[currentVehicleId];
    if (vehicleData) {
        updateVehicleData(vehicleData);
    }
}

export function manageCarDataVisibility() {
    hiderPosition.addEventListener("click", function() {
        carDataVisible = !carDataVisible;
        if (carDataVisible) {
            positionOptions.classList.add("visible");
            hiderPosition.classList.add("collapsed");
        } else {
            positionOptions.classList.remove("visible");
            hiderPosition.classList.remove("collapsed");
        }
    });

    previousVehicleIcon.addEventListener("click", () => {
        if (currentVehicleId > 1) {
            currentVehicleId--;
            updateVehicleDisplay();
        }
    });

    nextVehicleIcon.addEventListener("click", () => {
        if (currentVehicleId < totalVehicles) {
            currentVehicleId++;
            updateVehicleDisplay();
        }
    });
}

function updateSpeedGauge(value) {
    speedValueElement.textContent = value;
    const speed = parseInt(speedValueElement.textContent, 10);
    const limitedSpeed = Math.min(Math.max(speed, 0), 180);
    const angle = (limitedSpeed / 180) * 180;

    gaugeContainer.style.background = `conic-gradient(
        from -90deg at bottom,
        #530aa8 0deg,
        #530aa8 ${angle}deg,
        #dfdfdf ${angle}deg,
        #dfdfdf 180deg
    )`;
}

function updateFuelGauge(value) {
    const newValue = parseInt(value, 10);
    fuelContainer.style.background = `linear-gradient(
        to top,
        #530aa8 ${newValue}%,
        #dfdfdf 0%
    )`;
}

function updateRPMGauge(value) {
    rpmValueElement.textContent = value;
}

export function updateGauges(data) {
    updateSpeedGauge(data.vel);
    updateFuelGauge(data.fuel);
    updateRPMGauge(data.rpm);
}

export function setCurrentVehicleId(vehicleId) {
    currentVehicleId = vehicleId;
    updateVehicleDisplay();
}