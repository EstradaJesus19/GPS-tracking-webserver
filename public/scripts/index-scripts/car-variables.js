const speedValueElement = document.getElementById("speedValue");
const gaugeContainer = document.querySelector(".gaugeContainer");
const fuelContainer = document.getElementById("fuelContainer");

export function updateSpeedGauge() {
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
    fuelContainer.style.background = `linear-gradient(
        to top,
        #530aa8 ${value}%,
        #dfdfdf 0%
    )`;
}
