export class Visualization {
    constructor() {
        this.charts = {};
        this.dataPoints = 60; // Keep last 60 points
        this.lastMode = null;

        this.initCharts();
        this.initGauges();
        this.cacheElements();
    }

    cacheElements() {
        this.els = {
            log: document.getElementById('system-log'),
            modeHUD: document.getElementById('ems-mode-display'),
            battBar: document.getElementById('bar-batt-soc'),
            scBar: document.getElementById('bar-sc-soc'),
            battSocText: document.getElementById('val-batt-soc'),
            scSocText: document.getElementById('val-sc-soc'),
            battContrib: document.getElementById('summary-batt-pct'),
            scContrib: document.getElementById('summary-sc-pct'),
            // Raw data
            battV: document.getElementById('val-batt-v'),
            battI: document.getElementById('val-batt-i'),
            scV: document.getElementById('val-sc-v'),
            scI: document.getElementById('val-sc-i')
        };
    }

    initCharts() {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { display: false },
                y: {
                    grid: { color: '#30363d' },
                    ticks: { color: '#8b949e', font: { size: 10 } }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#c9d1d9', font: { size: 10 }, boxWidth: 10 }
                }
            },
            elements: {
                line: { tension: 0.3, borderWidth: 2 },
                point: { radius: 0 }
            }
        };

        // Current Chart
        this.charts.current = new Chart(document.getElementById('chart-current'), {
            type: 'line',
            data: {
                labels: Array(this.dataPoints).fill(''),
                datasets: [
                    { label: 'Battery (A)', borderColor: '#58a6ff', data: Array(this.dataPoints).fill(0) },
                    { label: 'Supercap (A)', borderColor: '#d29922', data: Array(this.dataPoints).fill(0) }
                ]
            },
            options: commonOptions
        });

        // Speed & Power Chart
        this.charts.speedPower = new Chart(document.getElementById('chart-speed-power'), {
            type: 'line',
            data: {
                labels: Array(this.dataPoints).fill(''),
                datasets: [
                    { label: 'Speed (km/h)', borderColor: '#3fb950', data: Array(this.dataPoints).fill(0) },
                    { label: 'Power (kW)', borderColor: '#f85149', data: Array(this.dataPoints).fill(0) }
                ]
            },
            options: commonOptions
        });
    }

    initGauges() {
        this.setupGauge('gauge-speed', '#58a6ff', 180); // 180 km/h max
        this.setupGauge('gauge-power', '#f85149', 100); // 100 kW max (bidirectional handled later)
    }

    setupGauge(id, color, max) {
        const container = document.getElementById(id);
        if (!container) return;

        container.innerHTML = `
            <svg viewBox="0 0 100 60" style="width: 100%; height: 100%;">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#21262d" stroke-width="8" stroke-linecap="round"/>
                <path id="${id}-fill" d="M 10 50 A 40 40 0 0 1 10 50" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" style="transition: d 0.3s ease;"/>
                <text x="50" y="45" id="${id}-val" text-anchor="middle" fill="#fff" font-family="JetBrains Mono" font-weight="700" font-size="12">0</text>
            </svg>
        `;
    }

    update(vehicle, battery, supercap, emsState) {
        // 1. Update Mode log
        if (this.lastMode !== emsState.mode) {
            this.logEvent(`System entered ${emsState.mode} mode`);
            this.lastMode = emsState.mode;

            // HUD Color update
            if (this.els.modeHUD) {
                this.els.modeHUD.textContent = emsState.mode + " MODE";
                this.els.modeHUD.className = 'mode-text';
                if (emsState.mode === 'BOOST') this.els.modeHUD.style.color = 'var(--neon-yellow)';
                else if (emsState.mode === 'REGEN') this.els.modeHUD.style.color = 'var(--neon-green)';
                else this.els.modeHUD.style.color = 'var(--neon-blue)';
            }
        }

        // 2. Update Gauges
        this.updateGauge('gauge-speed', vehicle.getSpeedKmh(), 180);
        this.updateGauge('gauge-power', vehicle.getPowerDemand(), 100);

        // 3. Update SOC Bars
        this.updateSOCBar(this.els.battBar, this.els.battSocText, battery.soc);
        this.updateSOCBar(this.els.scBar, this.els.scSocText, supercap.soc);

        // 4. Update Summary
        this.els.battContrib.textContent = `${Math.round(emsState.pctBatt)}%`;
        this.els.scContrib.textContent = `${Math.round(emsState.pctSC)}%`;

        // 5. Update Raw Data
        this.els.battV.textContent = `${battery.voltage.toFixed(1)} V`;
        this.els.battI.textContent = `${battery.current.toFixed(1)} A`;
        this.els.scV.textContent = `${supercap.voltage.toFixed(1)} V`;
        this.els.scI.textContent = `${supercap.current.toFixed(1)} A`;

        // 6. Update Charts (throtte to every 5 frames for performance if needed, but let's try 60fps first)
        this.updateChartData(this.charts.current, [battery.current, supercap.current]);
        this.updateChartData(this.charts.speedPower, [vehicle.getSpeedKmh(), vehicle.getPowerDemand()]);
    }

    updateGauge(id, val, max) {
        const fill = document.getElementById(`${id}-fill`);
        const text = document.getElementById(`${id}-val`);
        if (!fill || !text) return;

        const absVal = Math.abs(val);
        const ratio = Math.min(absVal / max, 1);

        // Calculate arc end point on a semicircle
        // Center: (50, 50), Radius: 40
        // Start: (10, 50) at angle π (left), End: (90, 50) at angle 0 (right)
        const startAngle = Math.PI;
        const currentAngle = startAngle - (ratio * Math.PI);

        const x = 50 + 40 * Math.cos(currentAngle);
        const y = 50 - 40 * Math.sin(currentAngle); // Negative sin: SVG Y-axis is inverted

        // Large arc flag needed when fill covers more than half the semicircle
        const largeArc = ratio > 0.5 ? 1 : 0;
        fill.setAttribute('d', `M 10 50 A 40 40 0 ${largeArc} 1 ${x} ${y}`);
        text.textContent = Math.round(val);
    }

    updateSOCBar(bar, text, soc) {
        if (!bar || !text) return;
        bar.style.width = `${soc.toFixed(1)}%`;
        text.textContent = `${soc.toFixed(1)}%`;

        // Color logic
        if (soc > 50) {
            bar.style.backgroundColor = 'var(--neon-green)';
            bar.style.boxShadow = '0 0 10px rgba(63, 185, 80, 0.4)';
        } else if (soc > 20) {
            bar.style.backgroundColor = 'var(--neon-yellow)';
            bar.style.boxShadow = '0 0 10px rgba(210, 153, 34, 0.4)';
        } else {
            bar.style.backgroundColor = 'var(--neon-red)';
            bar.style.boxShadow = '0 0 10px rgba(248, 81, 73, 0.4)';
        }
    }

    updateChartData(chart, values) {
        chart.data.datasets.forEach((dataset, i) => {
            dataset.data.shift();
            dataset.data.push(values[i]);
        });
        chart.update('none'); // Update without animation for performance
    }

    logEvent(message) {
        if (!this.els.log) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
        this.els.log.prepend(entry);

        // Limit log size
        if (this.els.log.children.length > 50) {
            this.els.log.removeChild(this.els.log.lastChild);
        }
    }
}
