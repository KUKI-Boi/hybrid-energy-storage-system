import { Vehicle } from './modules/vehicle.js';
import { Battery } from './modules/battery.js';
import { Supercapacitor } from './modules/supercap.js';
import { EMS } from './modules/ems.js';
import { Dashboard } from './modules/dashboard.js';
import { Animation } from './modules/animation.js';
import { Circuit } from './modules/circuit.js';
import { Visualization } from './modules/visualization.js';
import { Presentation } from './modules/presentation.js';

class App {
    constructor() {
        // Initialize Models
        this.vehicle = new Vehicle();
        this.battery = new Battery();
        this.supercap = new Supercapacitor();
        this.ems = new EMS();

        // Initialize UI Models
        this.dashboard = new Dashboard();
        this.animation = new Animation();
        this.circuit = new Circuit();
        this.visualization = new Visualization();
        this.presentation = new Presentation();

        // Control DOM
        this.throttleInput = document.getElementById('throttle-input');
        this.brakeInput = document.getElementById('brake-input');
        this.boostBtn = document.getElementById('boost-btn');
        this.cruiseBtn = document.getElementById('cruise-btn');
        this.demoBtn = document.getElementById('demo-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.resetBtn = document.getElementById('reset-btn');

        this.throttleVal = document.getElementById('throttle-val');
        this.brakeVal = document.getElementById('brake-val');
        this.surgeIndicator = document.getElementById('surge-indicator');

        this.setupEventListeners();

        // Timing
        this.lastTime = performance.now();

        // Start loop
        requestAnimationFrame((t) => this.loop(t));

        this.visualization.logEvent("HESS Diagnostic System Online");
        this.visualization.logEvent("Phase 6: Presentation Mode Ready");
    }

    setupEventListeners() {
        this.throttleInput.addEventListener('input', (e) => {
            if (this.presentation.demoActive) return;
            this.vehicle.throttle = e.target.value / 100;
            this.throttleVal.textContent = `${e.target.value}%`;
            // Cancel brake if throttle is pressed
            if (this.vehicle.throttle > 0) {
                this.brakeInput.value = 0;
                this.vehicle.brake = 0;
                this.brakeVal.textContent = `0%`;
            }
        });

        this.brakeInput.addEventListener('input', (e) => {
            if (this.presentation.demoActive) return;
            this.vehicle.brake = e.target.value / 100;
            this.brakeVal.textContent = `${e.target.value}%`;
            // Cancel throttle if brake is pressed
            if (this.vehicle.brake > 0) {
                this.throttleInput.value = 0;
                this.vehicle.throttle = 0;
                this.throttleVal.textContent = `0%`;
            }
        });

        if (this.boostBtn) {
            this.boostBtn.addEventListener('mousedown', () => {
                this.vehicle.isBoosting = true;
                this.visualization.logEvent("BOOST EVENT TRIGGERED");
            });
            this.boostBtn.addEventListener('mouseup', () => this.vehicle.isBoosting = false);
            this.boostBtn.addEventListener('mouseleave', () => this.vehicle.isBoosting = false);
            this.boostBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.vehicle.isBoosting = true; });
            this.boostBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.vehicle.isBoosting = false; });
        }

        if (this.cruiseBtn) {
            this.cruiseBtn.addEventListener('click', () => {
                if (this.presentation.demoActive) return;
                // Set to 25% throttle for cruise demonstration
                const cruiseThrottle = 25;
                this.vehicle.throttle = cruiseThrottle / 100;
                this.throttleInput.value = cruiseThrottle;
                this.throttleVal.textContent = `${cruiseThrottle}%`;
                this.vehicle.brake = 0;
                this.brakeInput.value = 0;
                this.brakeVal.textContent = `0%`;
                this.visualization.logEvent("CRUISE MODE ACTIVATED (25% Throttle)");
            });
        }

        if (this.demoBtn) {
            this.demoBtn.addEventListener('click', () => this.presentation.startDemo(this));
        }

        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.presentation.exportCSV());
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                this.presentation.reset();
            });
        }
    }

    loop(currentTime) {
        // Calculate dt in seconds (max 0.1s to prevent physics explosions on pause)
        let dt = (currentTime - this.lastTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        this.lastTime = currentTime;

        // 1. Update Vehicle Physics
        this.vehicle.update(dt);
        let powerDemand = this.vehicle.getPowerDemand();

        // 2. Intelligent Energy Management System (EMS) Phase 3
        let emsState = this.ems.update(powerDemand, this.supercap.soc);

        // 3. Update Storage Models
        this.battery.update(emsState.powerBatt, dt);
        this.supercap.update(emsState.powerSC, dt);

        // 4. Update UI Components
        this.dashboard.update(this.vehicle, this.battery, this.supercap, emsState);
        this.animation.render(this.vehicle, dt);

        // 5. Update Phase 4 Circuit Visualization
        this.circuit.update(emsState, this.battery, this.supercap, this.vehicle);

        // 6. Update Phase 5 Diagnostic Visuals
        this.visualization.update(this.vehicle, this.battery, this.supercap, emsState);

        // 7. Update Phase 6 Presentation Logic
        this.presentation.recordData(this.vehicle, this.battery, this.supercap);

        // Handle Surge Indicator Visibility
        if (this.surgeIndicator) {
            if (emsState.mode === 'BOOST' && Math.abs(emsState.powerSC) > 5) {
                this.surgeIndicator.classList.add('active');
            } else {
                this.surgeIndicator.classList.remove('active');
            }
        }

        // Request next frame
        requestAnimationFrame((t) => this.loop(t));
    }
}

// Start app when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
