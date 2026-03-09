export class EMS {
    constructor() {
        this.mode = 'CRUISE';
        this.boostThreshold = 20; // kW

        // Output power allocations
        this.powerBatt = 0;
        this.powerSC = 0;

        // Contribution percentages for UI
        this.pctBatt = 0;
        this.pctSC = 0;
    }

    update(powerDemand_kW, supercapSoc) {
        if (powerDemand_kW < 0) {
            // REGEN MODE (Negative Power Demand)
            this.mode = 'REGEN';
            let regenPower = Math.abs(powerDemand_kW);

            // Prioritize supercapacitor charging
            if (supercapSoc < 90) {
                // Supercap takes 100% of regen
                this.powerSC = -regenPower;
                this.powerBatt = 0;
                this.pctSC = 100;
                this.pctBatt = 0;
            } else {
                // Supercap full, battery takes the rest
                this.powerSC = 0;
                this.powerBatt = -regenPower;
                this.pctSC = 0;
                this.pctBatt = 100;
            }

        } else if (powerDemand_kW > this.boostThreshold) {
            // BOOST MODE (High Power Demand)
            this.mode = 'BOOST';

            if (supercapSoc > 5) {
                // Supercap handles 70% of the surge
                this.powerSC = powerDemand_kW * 0.70;
                this.powerBatt = powerDemand_kW * 0.30;
                this.pctSC = 70;
                this.pctBatt = 30;
            } else {
                // Supercap empty, battery takes the load
                this.powerSC = 0;
                this.powerBatt = powerDemand_kW;
                this.pctSC = 0;
                this.pctBatt = 100;
            }

        } else if (powerDemand_kW > 0) {
            // CRUISE MODE (Normal Driving, up to 20kW)
            this.mode = 'CRUISE';
            // Battery handles 90% of the steady load, Supercap 10%
            this.powerBatt = powerDemand_kW * 0.90;
            this.powerSC = powerDemand_kW * 0.10;
            this.pctBatt = 90;
            this.pctSC = 10;
        } else {
            // Coasting (0 kW)
            this.mode = 'CRUISE';
            this.powerBatt = 0;
            this.powerSC = 0;
            this.pctBatt = 0;
            this.pctSC = 0;
        }

        return {
            mode: this.mode,
            powerBatt: this.powerBatt,
            powerSC: this.powerSC,
            pctBatt: this.pctBatt,
            pctSC: this.pctSC
        };
    }
}
