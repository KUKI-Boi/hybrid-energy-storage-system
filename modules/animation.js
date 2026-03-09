export class Animation {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Handle resizing
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Load assets
        this.carImg = new Image();
        this.carImg.src = 'assets/car.svg';

        this.bgImg = new Image();
        this.bgImg.src = 'assets/background.svg';

        this.bgOffset = 0;
        this.wheelRotation = 0;
        this.time = 0;

        // Parallax Layers
        this.layers = [
            { speed: 0.05, offset: 0, color: '#090c10', height: 150 }, // Distant mountains
            { speed: 0.2, offset: 0, color: '#161b22', height: 100 },  // Midground buildings
            { speed: 1.0, offset: 0, color: '#1c2128', height: 50 }    // Foreground road/detail
        ];
    }

    resize() {
        let dpr = window.devicePixelRatio || 1;
        let rect = this.canvas.parentElement.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    render(vehicle, dt) {
        this.time += dt;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Parallax Background
        this.ctx.fillStyle = '#010409'; // Default sky
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.layers.forEach((layer, idx) => {
            layer.offset -= vehicle.speed * dt * layer.speed * 50;
            if (layer.offset <= -this.width) layer.offset = 0;

            this.ctx.fillStyle = layer.color;
            // Draw simple geometric "landscape" for the layer
            this.drawProceduralLayer(layer);
        });

        // 2. Draw Road
        this.drawRoad(vehicle, dt);

        // 3. Draw Car with Realism
        this.drawCar(vehicle, dt);
    }

    drawProceduralLayer(layer) {
        const h = this.height - layer.height - 50;
        this.ctx.beginPath();
        this.ctx.moveTo(layer.offset, h);

        // Loop to create "building" or "mountain" shapes
        for (let x = 0; x <= this.width * 2; x += 100) {
            const seed = (Math.floor((x - layer.offset) / 100) * 100);
            const randH = (Math.abs(Math.sin(seed * 0.01)) * layer.height);
            this.ctx.lineTo(layer.offset + x, h - randH);
            this.ctx.lineTo(layer.offset + x + 80, h - randH);
            this.ctx.lineTo(layer.offset + x + 100, h);
        }

        this.ctx.lineTo(layer.offset + this.width * 2, this.height);
        this.ctx.lineTo(layer.offset, this.height);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawRoad(vehicle, dt) {
        const roadY = this.height - 50;
        this.ctx.fillStyle = '#1c2128';
        this.ctx.fillRect(0, roadY, this.width, 50);

        // Dashed lines
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 20]);
        this.ctx.lineDashOffset = -this.bgOffset;
        this.ctx.beginPath();
        this.ctx.moveTo(0, roadY + 25);
        this.ctx.lineTo(this.width, roadY + 25);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset

        this.bgOffset -= vehicle.speed * dt * 50;
    }

    drawCar(vehicle, dt) {
        let carWidth = 360;
        let carHeight = 108;
        let carX = 150;
        let carYBase = this.height - carHeight - 50;

        // Suspension Oscillation
        // Subtle vertical movement based on acceleration and speed
        let osc = Math.sin(this.time * 8) * (Math.abs(vehicle.acceleration) * 0.2);
        // Squat/Dive Pitch
        let pitch = vehicle.acceleration * -0.5;

        // Final position
        let carY = carYBase + osc;

        this.ctx.save();
        this.ctx.translate(carX + carWidth / 2, carY + carHeight / 2);
        this.ctx.rotate(pitch * Math.PI / 180);

        if (this.carImg.complete) {
            this.ctx.drawImage(this.carImg, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
        } else {
            this.ctx.fillStyle = '#58a6ff';
            this.ctx.fillRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
        }

        // Brake Light Activation
        if (vehicle.brake > 0) {
            this.drawBrakeLight(-carWidth / 2 + 5, -carHeight / 2 + 35);
        }

        // Draw Separate Rotating Wheels
        let omega = vehicle.speed / 0.3;
        this.wheelRotation += omega * dt;

        let wheelRadius = 22 * 0.9;
        this.drawWheel(-108, 18, wheelRadius);
        this.drawWheel(90, 18, wheelRadius);

        this.ctx.restore();
    }

    drawBrakeLight(x, y) {
        this.ctx.save();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#f85149';
        this.ctx.fillStyle = '#f85149';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, 10, 25, [2, 0, 0, 2]);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawWheel(x, y, radius) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(this.wheelRotation);

        // Tire
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0d1117';
        this.ctx.fill();
        this.ctx.strokeStyle = '#161b22';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        // Rim
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        this.ctx.fillStyle = '#21262d';
        this.ctx.fill();

        // Detailed Spokes
        this.ctx.strokeStyle = '#c9d1d9';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(radius * 0.65, 0);
            this.ctx.stroke();
            this.ctx.rotate(Math.PI * 2 / 8);
        }

        // Hub
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#484f58';
        this.ctx.fill();

        this.ctx.restore();
    }
}
