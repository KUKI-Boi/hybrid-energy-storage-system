export class Presentation {
    constructor() {
        this.demoActive = false;
        this.history = [];
        this.startTime = Date.now();
        this.demoSequence = null;
    }

    recordData(vehicle, battery, supercap) {
        if (this.history.length > 3600) this.history.shift(); // Keep max 1 minute at 60fps

        this.history.push({
            time: ((Date.now() - this.startTime) / 1000).toFixed(2),
            speed: vehicle.getSpeedKmh().toFixed(2),
            power: vehicle.getPowerDemand().toFixed(2),
            battSoc: battery.soc.toFixed(2),
            scSoc: supercap.soc.toFixed(2),
            battCurrent: battery.current.toFixed(2),
            scCurrent: supercap.current.toFixed(2)
        });
    }

    exportCSV() {
        if (this.history.length === 0) {
            alert("No simulation data to export.");
            return;
        }

        const headers = ["Time (s)", "Speed (km/h)", "Power Demand (kW)", "Battery SOC (%)", "Supercap SOC (%)", "Battery Current (A)", "Supercap Current (A)"];
        const rows = this.history.map(d => [d.time, d.speed, d.power, d.battSoc, d.scSoc, d.battCurrent, d.scCurrent].join(","));
        const csvContent = [headers.join(","), ...rows].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `simulation_data_${new Date().toISOString().slice(0, 19)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async startDemo(app) {
        if (this.demoActive) return;
        this.demoActive = true;

        const setThrottle = (val) => {
            app.vehicle.throttle = val / 100;
            app.throttleInput.value = val;
            app.throttleVal.textContent = `${val}%`;
            app.vehicle.brake = 0;
            app.brakeInput.value = 0;
            app.brakeVal.textContent = `0%`;
        };

        const setBrake = (val) => {
            app.vehicle.brake = val / 100;
            app.brakeInput.value = val;
            app.brakeVal.textContent = `${val}%`;
            app.vehicle.throttle = 0;
            app.throttleInput.value = 0;
            app.throttleVal.textContent = `0%`;
        };

        try {
            app.visualization.logEvent("DEMO MODE STARTED");

            // 1. Gradual Acceleration
            app.visualization.logEvent("Phase 1: Gradual Acceleration (Battery Dominant)");
            for (let i = 0; i <= 20; i += 2) {
                if (!this.demoActive) return;
                setThrottle(i);
                await this.wait(200);
            }
            await this.wait(2000);

            // 2. Acceleration Surge (Boost)
            app.visualization.logEvent("Phase 2: Acceleration Surge (Supercapacitor Boost)");
            setThrottle(80);
            app.vehicle.isBoosting = true;
            await this.wait(3000);
            app.vehicle.isBoosting = false;

            // 3. Steady Cruise
            app.visualization.logEvent("Phase 3: Steady Cruise (High Efficiency)");
            setThrottle(15);
            await this.wait(4000);

            // 4. Regenerative Braking
            app.visualization.logEvent("Phase 4: Regenerative Braking (Energy Recovery)");
            setBrake(60);
            await this.wait(4000);

            setBrake(0);
            app.visualization.logEvent("DEMO SEQUENCE COMPLETE");
        } finally {
            this.demoActive = false;
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        window.location.reload();
    }
}
