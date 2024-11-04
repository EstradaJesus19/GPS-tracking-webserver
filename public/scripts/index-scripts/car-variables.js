import { vehiclePaths } from './fetch-data.js';

let carDataVisible = true;
export let currentVehicleId = 1;
let totalVehicles = 0;

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
const vehicle1Checkbox = document.getElementById('vehicle1Checkbox');
const vehicle2Checkbox = document.getElementById('vehicle2Checkbox');

export function selectVehicles() {
    vehicle1Checkbox.click();
    vehicle2Checkbox.click();
}

export function manageCarDataVisibility() {
    hiderPosition.addEventListener("click", function() {
        carDataVisible = !carDataVisible;
        positionOptions.classList.toggle("visible", carDataVisible);
        hiderPosition.classList.toggle("collapsed", carDataVisible);
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

    vehicle1Checkbox.addEventListener('change', updateVehicleSelection);
    vehicle2Checkbox.addEventListener('change', updateVehicleSelection);
}

function updateVehicleSelection() {
    const selectedVehicles = [];
    if (vehicle1Checkbox.checked) selectedVehicles.push(1);
    if (vehicle2Checkbox.checked) selectedVehicles.push(2);
    totalVehicles = selectedVehicles.length;
    
    if (totalVehicles > 0) {
        currentVehicleId = selectedVehicles[0];
        updateVehicleDisplay();
    } else {
        showDefaultValues();
        currentVehicleId = 0;
    }
    updateNavigationButtons();
}

function updateNavigationButtons() {
    previousVehicleIcon.disabled = currentVehicleId === 1 || totalVehicles <= 1;
    updateButtonsVisibility(previousVehicleIcon);
    nextVehicleIcon.disabled = currentVehicleId === totalVehicles || totalVehicles <= 1;
    updateButtonsVisibility(nextVehicleIcon);
}

function updateButtonsVisibility(icon) {
    if (icon.disabled) {
        icon.style.opacity = 0.25;
    } else {
        icon.style.opacity = 1;
    }
}

export function updateVehicleData(data) {
    vehicleName.textContent = `Vehicle ${data.vehicle_id}`;
    latitudeInput.textContent = data.latitude || 'NA';
    longitudeInput.textContent = data.longitude || 'NA';
    dateInput.textContent = data.date ? new Date(data.date).toISOString().split('T')[0] : 'NA';
    timeInput.textContent = data.time || 'NA';
    updateGauges(data);
    updateNavigationButtons();
}

function updateVehicleDisplay() {
    const vehicleData = vehiclePaths[`vehicle${currentVehicleId}`];
    if (vehicleData) {
        updateVehicleData(vehicleData);
    }
}

function showDefaultValues() {
    vehicleName.textContent = 'Vehicle NA';
    latitudeInput.textContent = 'NA';
    longitudeInput.textContent = 'NA';
    dateInput.textContent = 'NA';
    timeInput.textContent = 'NA';
    updateGauges({ vel: 0, fuel: 0, rpm: 0 });
}

function updateSpeedGauge(value) {
    speedValueElement.textContent = value;
    const limitedSpeed = Math.min(Math.max(parseInt(value, 10), 0), 180);
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
