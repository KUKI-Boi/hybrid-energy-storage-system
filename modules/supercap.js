export class Supercapacitor {
    constructor() {
        // Supercapacitor Parameters
        this.C = 300; // Capacitance (Farads)
        this.V_max = 48; // Maximum Voltage (V)
        this.R = 0.01; // Internal resistance (Ohms) (assumed small but non-zero)

        // State variables
        this.voltage = 36; // Initial Voltage (V)
        this.current = 0; // A
        this.power = 0; // kW
        this.soc = this.calculateSOC(); // Initial SOC (%)
    }

    update(powerDemand_kW, dt) {
        this.power = powerDemand_kW;

        let P_watts = this.power * 1000;

        // P = (V - I*R) * I => I^2*R - V*I + P = 0
        let discriminant = this.voltage * this.voltage - 4 * this.R * P_watts;

        if (discriminant >= 0) {
            this.current = (this.voltage - Math.sqrt(discriminant)) / (2 * this.R);
        } else {
            // Provide max possible current
            this.current = this.voltage / (2 * this.R);
        }

        // V = (1/C) * int(I dt) => dV = - (I / C) * dt
        // Discharging (positive I) reduces voltage
        this.voltage -= (this.current / this.C) * dt;

        // Cap voltage
        if (this.voltage > this.V_max) this.voltage = this.V_max;
        if (this.voltage < 0) this.voltage = 0; // Prevent negative voltage

        this.soc = this.calculateSOC();
    }

    calculateSOC() {
        // Energy in capacitor: E = 0.5 * C * V^2
        // SOC based on voltage squared ratio according to Phase 2 reqs: SOC = (V^2 / Vmax^2) * 100
        let soc = ((this.voltage * this.voltage) / (this.V_max * this.V_max)) * 100;
        return Math.max(0, Math.min(100, soc));
    }
}
