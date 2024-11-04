let carDataVisible = true;

const speedValueElement = document.getElementById("speedValue");
const gaugeContainer = document.querySelector(".gaugeContainer");
const rpmValueElement = document.getElementById("rpmValue");
const fuelContainer = document.getElementById("fuelContainer");
const vehicleName = document.getElementById("vehicleName");
const previousVehicleIcon = document.getElementById("previousVehicleIcon");
const nextVehicleIcon = document.getElementById("nextVehicleIcon");
const positionOptions = document.getElementById("positionOptions");
const hiderPosition = document.getElementById("hiderPosition");
const vehicle1Checkbox = document.getElementById('vehicle1Checkbox');
const vehicle2Checkbox = document.getElementById('vehicle2Checkbox');

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
}

export function updateSpeedGauge(value) {
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

export function updateFuelGauge(value) {
    const newValue = parseInt(value, 10);
    fuelContainer.style.background = `linear-gradient(
        to top,
        #530aa8 ${newValue}%,
        #dfdfdf 0%
    )`;
}

export function updateRPMGauge(value) {
    rpmValueElement.textContent = value;
}
