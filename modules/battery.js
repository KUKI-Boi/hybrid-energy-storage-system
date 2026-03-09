export class Battery {
    constructor() {
        // Battery Parameters
        this.Voc = 400; // Nominal Open circuit voltage (V)
        this.R = 0.05; // Internal resistance (Ohms)
        this.capacity = 50; // Battery Capacity (kWh)

        // State variables
        this.soc = 80; // Initial SOC (%)
        this.current = 0; // A
        this.voltage = this.Voc; // V
        this.power = 0; // kW
    }

    update(powerDemand_kW, dt) {
        this.power = powerDemand_kW;

        // P = V * I  =>  I = P / V
        let P_watts = this.power * 1000;

        // P = (Voc - I*R) * I => I^2*R - Voc*I + P = 0
        // I = (Voc - sqrt(Voc^2 - 4*R*P)) / (2*R)
        let discriminant = this.Voc * this.Voc - 4 * this.R * P_watts;

        if (discriminant >= 0) {
            this.current = (this.Voc - Math.sqrt(discriminant)) / (2 * this.R);
        } else {
            // Power demand too high for this timestep, provide max current
            this.current = this.Voc / (2 * this.R);
        }

        // V = Voc - I * R (discharge is positive I, charge is negative I)
        this.voltage = this.Voc - (this.current * this.R);

        // Update SOC: SOC(t) = SOC(t−1) − (PowerBattery × dt) / BatteryEnergy
        // Note: dt is in seconds. Battery Energy is in kWh. 
        // Need to convert dt to hours (dt / 3600) to keep units consistent: kWh
        let energyUsed_kWh = this.power * (dt / 3600);

        // Calculate the percentage of total capacity used
        let socChange = (energyUsed_kWh / this.capacity) * 100;

        this.soc -= socChange;

        // Cap SOC between 0% and 100%
        if (this.soc < 0) this.soc = 0;
        if (this.soc > 100) this.soc = 100;
    }
}
