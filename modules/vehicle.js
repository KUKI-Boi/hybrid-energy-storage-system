export class Vehicle {
    constructor() {
        // Constants
        this.mass = 1600; // kg
        this.Cd = 0.28;
        this.A = 2.2; // frontal area, m^2
        this.rho = 1.225; // air density, kg/m^3
        this.Crr = 0.015; // rolling resistance coefficient
        this.g = 9.81; // m/s^2
        this.wheelRadius = 0.3; // m
        this.maxTraction = 5000; // N
        this.maxBrake = 8000; // N

        // State variables
        this.speed = 0; // m/s
        this.acceleration = 0; // m/s^2
        this.distance = 0; // m
        
        // Inputs
        this.throttle = 0; // 0 to 1
        this.brake = 0; // 0 to 1
        this.isBoosting = false;
    }

    update(dt) {
        // Inputs
        let currentMaxTraction = this.isBoosting ? this.maxTraction * 1.5 : this.maxTraction;
        
        // Forces
        let F_traction = this.throttle * currentMaxTraction;
        let F_drag = 0.5 * this.rho * this.Cd * this.A * this.speed * this.speed;
        let F_roll = this.Crr * this.mass * this.g;
        
        // Rolling resistance acts against motion, but doesn't pull backward when stationary
        if (this.speed < 0.1 && F_traction === 0) {
            F_roll = 0; // Prevent reversing when stopped
        }

        let F_brake = this.brake * this.maxBrake;
        if (this.speed < 0.1 && F_traction === 0) {
            F_brake = 0; // Prevent braking from pulling backward
        }

        let F_net = F_traction - F_drag - F_roll - F_brake;

        // Acceleration
        this.acceleration = F_net / this.mass;

        // Update Speed
        this.speed += this.acceleration * dt;
        if (this.speed < 0) {
            this.speed = 0;
            this.acceleration = 0;
        }

        // Distance
        this.distance += this.speed * dt;
    }

    getPowerDemand() {
        // Mechanical power = Force * Velocity
        // Traction power is positive, braking power (regen) is negative
        let currentMaxTraction = this.isBoosting ? this.maxTraction * 1.5 : this.maxTraction;
        let F_traction = this.throttle * currentMaxTraction;
        let F_brake = this.brake * this.maxBrake;
        
        let mechanicalPower = (F_traction - F_brake) * this.speed; // Watts
        
        // Convert to kW
        return mechanicalPower / 1000;
    }

    getSpeedKmh() {
        return this.speed * 3.6;
    }
}
