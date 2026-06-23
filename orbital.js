class OrbitalEngine {
    constructor(canvasId, infoPanelId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.infoPanel = document.getElementById(infoPanelId);
        this.asteroids = [];
        this.selectedAsteroid = null;
        this.hoveredAsteroid = null;

        // Viewport settings for panning and zooming
        this.zoom = 1;
        this.targetZoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.targetPanX = 0;
        this.targetPanY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;

        // Radar sweep angle
        this.radarAngle = 0;

        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        this.resize();
        this.centerPan();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    centerPan() {
        this.panX = this.canvas.width / 2;
        this.panY = this.canvas.height / 2;
        this.targetPanX = this.panX;
        this.targetPanY = this.panY;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.centerPan();
        });

        // Mouse interactions
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const coords = this.getCanvasCoords(e);
            this.startX = coords.x - this.panX;
            this.startY = coords.y - this.panY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const coords = this.getCanvasCoords(e);
            if (this.isDragging) {
                this.targetPanX = coords.x - this.startX;
                this.targetPanY = coords.y - this.startY;
            } else {
                this.checkHover(coords.x, coords.y);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Touch interactions (Mobile/Tablet)
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                const coords = this.getCanvasCoords(e.touches[0]);
                this.startX = coords.x - this.panX;
                this.startY = coords.y - this.panY;
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const coords = this.getCanvasCoords(e.touches[0]);
                if (this.isDragging) {
                    this.targetPanX = coords.x - this.startX;
                    this.targetPanY = coords.y - this.startY;
                } else {
                    this.checkHover(coords.x, coords.y);
                }
            }
        });

        window.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            if (e.deltaY < 0) {
                this.targetZoom = Math.min(this.targetZoom * zoomFactor, 3);
            } else {
                this.targetZoom = Math.max(this.targetZoom / zoomFactor, 0.4);
            }
            if (window.aetherAudio) window.aetherAudio.playHover();
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredAsteroid) {
                this.selectedAsteroid = this.hoveredAsteroid;
                this.showTelemetry(this.selectedAsteroid);
                if (window.aetherAudio) window.aetherAudio.playClick();
            }
        });
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    checkHover(mx, my) {
        let found = null;
        const threshold = 15; // click padding in pixels

        for (const ast of this.asteroids) {
            // Project asteroid screen coordinates
            const ax = this.panX + ast.currentX * this.zoom;
            const ay = this.panY + ast.currentY * this.zoom;
            const dist = Math.hypot(mx - ax, my - ay);

            if (dist < threshold) {
                found = ast;
                break;
            }
        }

        if (found !== this.hoveredAsteroid) {
            this.hoveredAsteroid = found;
            if (found && window.aetherAudio) {
                window.aetherAudio.playHover();
            }
        }
    }

    async loadData(apiKey) {
        const today = new Date().toISOString().split('T')[0];
        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`;

        try {
            document.getElementById('orbital-status').innerText = 'ACQUIRING NEOWS TELEMETRY...';
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            this.parseData(data, today);
            document.getElementById('orbital-status').innerText = 'ORBITAL ENGINE STABLE';
        } catch (error) {
            console.warn('NASA NeoWs API failed. Loading offline simulation dataset.', error);
            this.loadMockData();
            document.getElementById('orbital-status').innerText = 'ORBITAL ENGINE (SIMULATED DATA)';
        }
    }

    parseData(data, dateStr) {
        const neos = data.near_earth_objects[dateStr] || [];
        this.asteroids = neos.map((neo, idx) => {
            const diameterMin = neo.estimated_diameter.meters.estimated_diameter_min;
            const diameterMax = neo.estimated_diameter.meters.estimated_diameter_max;
            const avgDiameter = (diameterMin + diameterMax) / 2;
            const closeApproach = neo.close_approach_data[0] || {};
            const speed = parseFloat(closeApproach.relative_velocity.kilometers_per_hour);
            const missDist = parseFloat(closeApproach.miss_distance.kilometers);
            const isHazardous = neo.is_potentially_hazardous_asteroid;

            // Distribute orbital radius between 100px and 350px
            const orbitRadius = 100 + (idx * 25) + Math.random() * 10;
            // Random initial angle
            const angle = Math.random() * Math.PI * 2;
            // Angular velocity inversely proportional to radius
            const speedFactor = 0.0005 + (150 / orbitRadius) * 0.001;

            return {
                id: neo.id,
                name: neo.name.replace(/[\(\)]/g, ''),
                diameter: Math.round(avgDiameter),
                velocity: Math.round(speed),
                distance: Math.round(missDist),
                isHazardous: isHazardous,
                radius: orbitRadius,
                angle: angle,
                angularSpeed: speedFactor,
                currentX: 0,
                currentY: 0
            };
        });

        if (this.asteroids.length > 0) {
            this.selectedAsteroid = this.asteroids[0];
            this.showTelemetry(this.selectedAsteroid);
        }
    }

    loadMockData() {
        const mockNeos = [
            { id: '1', name: 'Apophis 99942', diameter: 370, velocity: 45000, distance: 31000, isHazardous: true, radius: 110, angularSpeed: 0.006 },
            { id: '2', name: 'Bennu 101955', diameter: 490, velocity: 101000, distance: 7500000, isHazardous: true, radius: 150, angularSpeed: 0.004 },
            { id: '3', name: '2023 RS', diameter: 18, velocity: 32000, distance: 240000, isHazardous: false, radius: 200, angularSpeed: 0.003 },
            { id: '4', name: 'Hermes 1937', diameter: 1000, velocity: 58000, distance: 6800000, isHazardous: false, radius: 240, angularSpeed: 0.002 },
            { id: '5', name: 'Toutatis 4179', diameter: 2450, velocity: 39000, distance: 7400000, isHazardous: true, radius: 280, angularSpeed: 0.0015 },
            { id: '6', name: '2026 AF5', diameter: 140, velocity: 27000, distance: 1800000, isHazardous: false, radius: 320, angularSpeed: 0.0012 }
        ];

        this.asteroids = mockNeos.map(m => ({
            ...m,
            angle: Math.random() * Math.PI * 2,
            currentX: 0,
            currentY: 0
        }));

        this.selectedAsteroid = this.asteroids[0];
        this.showTelemetry(this.selectedAsteroid);
    }

    showTelemetry(ast) {
        if (!this.infoPanel) return;

        const hazardBadge = ast.isHazardous 
            ? `<span class="badge badge-warning font-mono">HAZARDOUS RANGE</span>` 
            : `<span class="badge badge-safe font-mono">SAFE PATHWAY</span>`;

        this.infoPanel.innerHTML = `
            <div class="panel-header">
                <span class="panel-tag">OBJECT ANALYSIS</span>
                <h2>${ast.name}</h2>
            </div>
            <div class="panel-body">
                <div class="telemetry-grid">
                    <div class="telemetry-item">
                        <span class="label">CLASSIFICATION</span>
                        <div class="value">${hazardBadge}</div>
                    </div>
                    <div class="telemetry-item">
                        <span class="label">EST. DIAMETER</span>
                        <div class="value font-mono">${ast.diameter.toLocaleString()} m</div>
                    </div>
                    <div class="telemetry-item">
                        <span class="label">ORBIT VELOCITY</span>
                        <div class="value font-mono">${ast.velocity.toLocaleString()} km/h</div>
                    </div>
                    <div class="telemetry-item">
                        <span class="label">MISS DISTANCE</span>
                        <div class="value font-mono">${ast.distance.toLocaleString()} km</div>
                    </div>
                    <div class="telemetry-item">
                        <span class="label">ORBIT PATH RADIUS</span>
                        <div class="value font-mono">${Math.round(ast.radius * 1000).toLocaleString()} km</div>
                    </div>
                </div>
                <div class="radar-line-glow mt-4"></div>
            </div>
        `;
    }

    animate() {
        // Interpolate zoom and pan for buttery smooth movements
        this.zoom += (this.targetZoom - this.zoom) * 0.1;
        this.panX += (this.targetPanX - this.panX) * 0.1;
        this.panY += (this.targetPanY - this.panY) * 0.1;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw HUD background circular grids
        this.drawHUDGrid();

        // Update & draw orbits and asteroids
        this.asteroids.forEach(ast => {
            // Increment angle
            ast.angle += ast.angularSpeed;
            // Compute coordinate relative to Earth center (0,0)
            ast.currentX = Math.cos(ast.angle) * ast.radius;
            ast.currentY = Math.sin(ast.angle) * ast.radius;

            // Draw dashed orbit path
            this.ctx.strokeStyle = ast.isHazardous ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.08)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 6]);
            this.ctx.beginPath();
            this.ctx.arc(this.panX, this.panY, ast.radius * this.zoom, 0, Math.PI * 2);
            this.ctx.stroke();

            // Asteroid position on canvas
            const ax = this.panX + ast.currentX * this.zoom;
            const ay = this.panY + ast.currentY * this.zoom;

            // Draw asteroid core
            this.ctx.fillStyle = ast.isHazardous ? '#ef4444' : '#06b6d4';
            this.ctx.beginPath();
            this.ctx.arc(ax, ay, (ast.isHazardous ? 5 : 4) * this.zoom, 0, Math.PI * 2);
            this.ctx.fill();

            // Hover indicator
            if (ast === this.hoveredAsteroid || ast === this.selectedAsteroid) {
                // Vector tracking line from Earth to asteroid
                this.ctx.strokeStyle = ast.isHazardous ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([2, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.panX, this.panY);
                this.ctx.lineTo(ax, ay);
                this.ctx.stroke();

                // Glow ring
                this.ctx.strokeStyle = ast.isHazardous ? '#ef4444' : '#06b6d4';
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([]);
                this.ctx.beginPath();
                this.ctx.arc(ax, ay, 9 * this.zoom, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Draw names for hazardous or hovered ones
            if (ast === this.hoveredAsteroid || (ast.isHazardous && this.zoom > 1.2)) {
                this.ctx.fillStyle = ast.isHazardous ? '#fca5a5' : '#e0f7fa';
                this.ctx.font = '10px "Share Tech Mono"';
                this.ctx.fillText(ast.name, ax + 12, ay + 3);
            }
        });

        // Draw Earth (Center)
        this.drawEarth();

        // Draw radar sweep line
        this.drawRadarSweep();

        requestAnimationFrame(() => this.animate());
    }

    drawHUDGrid() {
        this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
        this.ctx.setLineDash([]);
        
        // Draw crosshairs
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.panY);
        this.ctx.lineTo(this.canvas.width, this.panY);
        this.ctx.moveTo(this.panX, 0);
        this.ctx.lineTo(this.panX, this.canvas.height);
        this.ctx.stroke();

        // Concentric HUD circles
        const radii = [100, 200, 300, 400];
        radii.forEach(r => {
            this.ctx.beginPath();
            this.ctx.arc(this.panX, this.panY, r * this.zoom, 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }

    drawEarth() {
        this.ctx.setLineDash([]);
        // Glow layer
        const earthGlow = this.ctx.createRadialGradient(
            this.panX, this.panY, 2 * this.zoom,
            this.panX, this.panY, 15 * this.zoom
        );
        earthGlow.addColorStop(0, '#ffffff');
        earthGlow.addColorStop(0.3, '#3b82f6');
        earthGlow.addColorStop(0.8, 'rgba(59, 130, 246, 0.2)');
        earthGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');

        this.ctx.fillStyle = earthGlow;
        this.ctx.beginPath();
        this.ctx.arc(this.panX, this.panY, 15 * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();

        // Solid Earth Core
        this.ctx.fillStyle = '#1e3a8a';
        this.ctx.strokeStyle = '#60a5fa';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.panX, this.panY, 7 * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawRadarSweep() {
        this.radarAngle += 0.005;
        const sweepLength = Math.max(this.canvas.width, this.canvas.height);

        // Drawing a gradient arc for sweep trail
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.rotate(this.radarAngle);

        const sweepGradient = this.ctx.createLinearGradient(0, 0, sweepLength, 0);
        sweepGradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
        sweepGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        this.ctx.fillStyle = sweepGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, sweepLength, -0.15, 0);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }
}

// Bind to window
window.OrbitalEngine = OrbitalEngine;
