export class Dashboard {
    constructor() {
        // Cache DOM elements
        this.els = {
            speed: document.getElementById('val-speed'),
            accel: document.getElementById('val-accel'),
            power: document.getElementById('val-power'),
            battV: document.getElementById('val-batt-v'),
            battI: document.getElementById('val-batt-i'),
            battSoc: document.getElementById('val-batt-soc'),
            battP: document.getElementById('val-batt-p'),
            battPct: document.getElementById('summary-batt-pct'),
            scV: document.getElementById('val-sc-v'),
            scI: document.getElementById('val-sc-i'),
            scSoc: document.getElementById('val-sc-soc'),
            scP: document.getElementById('val-sc-p'),
            scPct: document.getElementById('summary-sc-pct'),
            modeBadge: document.getElementById('ems-mode-display')
        };
    }

    update(vehicle, battery, supercap, emsState) {
        // Update vehicle values
        if (this.els.speed) this.els.speed.textContent = `${vehicle.getSpeedKmh().toFixed(1)} km/h`;
        if (this.els.accel) this.els.accel.textContent = `${vehicle.acceleration.toFixed(2)} m/s²`;
        if (this.els.power) this.els.power.textContent = `${vehicle.getPowerDemand().toFixed(1)} kW`;

        // Update EMS Mode Badge
        if (this.els.modeBadge) {
            this.els.modeBadge.textContent = emsState.mode + " MODE";
            // Note: visualization.js also handles modeHUD styling, this is for redundancy
        }

        // Update battery values
        if (this.els.battV) this.els.battV.textContent = `${battery.voltage.toFixed(1)} V`;
        if (this.els.battI) this.els.battI.textContent = `${battery.current.toFixed(1)} A`;
        if (this.els.battSoc) this.els.battSoc.textContent = `${battery.soc.toFixed(1)}%`;
        if (this.els.battP) this.els.battP.textContent = `${battery.power.toFixed(1)} kW`;
        if (this.els.battPct) this.els.battPct.textContent = `${Math.round(emsState.pctBatt)}%`;

        // Update supercap values
        if (this.els.scV) this.els.scV.textContent = `${supercap.voltage.toFixed(1)} V`;
        if (this.els.scI) this.els.scI.textContent = `${supercap.current.toFixed(1)} A`;
        if (this.els.scSoc) this.els.scSoc.textContent = `${supercap.soc.toFixed(1)}%`;
        if (this.els.scP) this.els.scP.textContent = `${supercap.power.toFixed(1)} kW`;
        if (this.els.scPct) this.els.scPct.textContent = `${Math.round(emsState.pctSC)}%`;
    }
}
