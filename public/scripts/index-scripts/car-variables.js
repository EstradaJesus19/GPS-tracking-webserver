const speedValueElement = document.getElementById("speedValue");
const gaugeContainer = document.querySelector(".gaugeContainer");
const rpmValueElement = document.getElementById("rpmValue");
const fuelContainer = document.getElementById("fuelContainer");

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
