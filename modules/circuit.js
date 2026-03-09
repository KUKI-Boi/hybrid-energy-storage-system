export class Circuit {
    constructor() {
        // Cache DOM elements for components
        this.els = {
            battBox: document.getElementById('circuit-batt-box'),
            scBox: document.getElementById('circuit-sc-box'),
            motorBox: document.getElementById('circuit-motor-box'),

            // Paths
            battPathAnim: document.getElementById('anim-batt'),
            scPathAnim: document.getElementById('anim-sc'),
            motorPathAnim: document.getElementById('anim-motor'),
        };
    }

    update(emsState, battery, supercap, vehicle) {
        if (!this.els.battBox) return; // fail safe

        const pBatt = emsState.powerBatt;
        const pSC = emsState.powerSC;
        const pMotor = vehicle.getPowerDemand();

        // Update Battery flow
        this.updateBranch(this.els.battBox, this.els.battPathAnim, pBatt, 'Battery');

        // Update Supercap flow
        this.updateBranch(this.els.scBox, this.els.scPathAnim, pSC, 'Supercapacitor');

        // Update Motor flow
        this.updateBranch(this.els.motorBox, this.els.motorPathAnim, pMotor, 'Motor');
    }

    updateBranch(box, pathAnim, power, label) {
        const threshold = 0.5; // kW

        // Reset classes
        box.classList.remove('glow-red', 'glow-green', 'glow-blue');
        pathAnim.classList.remove('flow-fwd-red', 'flow-rev-green', 'flow-idle');

        // Dynamic Glow Intensity
        // Calculate intensity based on power (0 to 1)
        const intensity = Math.min(Math.abs(power) / 50, 1);
        const blur = 5 + (intensity * 15); // 5px to 20px blur

        if (Math.abs(power) < threshold) {
            box.classList.add('glow-blue');
            box.style.filter = 'drop-shadow(0 0 5px rgba(88, 166, 255, 0.5))';
            pathAnim.classList.add('flow-idle');
            return;
        }

        if (power > 0) {
            // Discharging / Consuming
            box.classList.add('glow-red');
            box.style.filter = `drop-shadow(0 0 ${blur}px rgba(248, 81, 73, ${0.3 + intensity * 0.7}))`;
            pathAnim.classList.add('flow-fwd-red');
        } else {
            // Charging / Generating
            box.classList.add('glow-green');
            box.style.filter = `drop-shadow(0 0 ${blur}px rgba(63, 185, 80, ${0.3 + intensity * 0.7}))`;
            pathAnim.classList.add('flow-rev-green');
        }

        // Adjust animation speed based on power magnitude (faster for higher power)
        let speed = Math.max(0.2, 2.0 - (Math.abs(power) / 200));
        pathAnim.style.animationDuration = `${speed}s`;
    }
}
