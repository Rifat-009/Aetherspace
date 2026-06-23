class RoverAnalyzer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.photos = [];
        this.activePhoto = null;
        this.activeFilter = 'original';

        // Editor Canvas
        this.editorCanvas = document.createElement('canvas');
        this.editorCtx = this.editorCanvas.getContext('2d');
        this.originalImageData = null;

        // Offline mock photos as fallback
        this.mockPhotos = [
            {
                img_src: 'https://images.unsplash.com/photo-1612892483236-42d68a57623d?auto=format&fit=crop&w=800&q=80',
                camera: { full_name: 'Front Hazard Avoidance Camera' },
                earth_date: '2021-02-18',
                sol: 1
            },
            {
                img_src: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=80',
                camera: { full_name: 'Navigation Camera' },
                earth_date: '2021-03-05',
                sol: 15
            },
            {
                img_src: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
                camera: { full_name: 'Mast Camera' },
                earth_date: '2021-04-12',
                sol: 50
            }
        ];

        this.init();
    }

    init() {
        this.renderLayout();
        this.bindEvents();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="rover-layout">
                <!-- Search Controls -->
                <div class="panel glass-panel rover-sidebar">
                    <div class="panel-header">
                        <span class="panel-tag">ROVER COMMAND</span>
                        <h2>TELEMETRY DECK</h2>
                    </div>
                    <div class="panel-body">
                        <div class="form-group">
                            <label>ROVER</label>
                            <select id="rover-select" class="hud-select">
                                <option value="curiosity">CURIOSITY</option>
                                <option value="opportunity">OPPORTUNITY</option>
                                <option value="spirit">SPIRIT</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>CAMERA SYSTEM</label>
                            <select id="camera-select" class="hud-select">
                                <option value="navcam">NAVCAM (NAVIGATIONAL)</option>
                                <option value="fhaz">FHAZ (FRONT HAZARD)</option>
                                <option value="rhaz">RHAZ (REAR HAZARD)</option>
                                <option value="mast">MAST (MAST CAMERA)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>MARTIAN SOL (DAY)</label>
                            <input type="number" id="sol-input" class="hud-input" value="1000" min="1">
                        </div>
                        <button id="rover-fetch-btn" class="hud-btn glow-cyan w-full">INITIATE ACQUISITION</button>
                        
                        <div class="rover-results-header mt-6">
                            <span class="label">CAPTURED STREAM</span>
                            <div id="rover-count" class="font-mono text-cyan">0 IMAGES</div>
                        </div>
                        
                        <!-- Thumbnail Grid -->
                        <div id="rover-gallery-grid" class="rover-thumbnails">
                            <!-- Thumbnails load here -->
                        </div>
                    </div>
                </div>

                <!-- Analysis Screen -->
                <div class="panel glass-panel rover-viewport">
                    <div class="panel-header flex justify-between items-center">
                        <div>
                            <span class="panel-tag">IMAGE PROCESSING</span>
                            <h2 id="viewport-title">NO STREAM SELECTED</h2>
                        </div>
                        <div class="filter-controls flex gap-2">
                            <button class="filter-btn active" data-filter="original">RAW</button>
                            <button class="filter-btn" data-filter="hud">HUD TELEMETRY</button>
                            <button class="filter-btn" data-filter="nv">NIGHT VISION</button>
                            <button class="filter-btn" data-filter="thermal">THERMAL</button>
                            <button class="filter-btn" data-filter="edges">EDGES</button>
                        </div>
                    </div>
                    <div class="panel-body flex flex-col items-center justify-center relative">
                        <div id="analysis-hud-container" class="analysis-hud-container">
                            <div class="canvas-wrapper">
                                <div id="analysis-placeholder" class="analysis-placeholder">
                                    <div class="pulse-warning">AWAITING CAMERA STREAM SELECT</div>
                                </div>
                                <canvas id="analysis-canvas" style="display: none;"></canvas>
                            </div>
                        </div>
                        <!-- Meta overlay -->
                        <div id="photo-telemetry-overlay" class="photo-telemetry-overlay font-mono">
                            <div>SOL: <span id="tel-sol">--</span></div>
                            <div>DATE: <span id="tel-date">--</span></div>
                            <div>CAM: <span id="tel-cam">--</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('analysis-canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    bindEvents() {
        document.getElementById('rover-fetch-btn').addEventListener('click', () => {
            const rover = document.getElementById('rover-select').value;
            const camera = document.getElementById('camera-select').value;
            const sol = document.getElementById('sol-input').value;
            
            if (window.aetherAudio) window.aetherAudio.playScan();
            this.fetchPhotos(rover, camera, sol);
        });

        // Filter button listeners
        this.container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setFilter(filter);
            });
        });
    }

    async fetchPhotos(rover, camera, sol) {
        const apiKey = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';
        const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&camera=${camera}&api_key=${apiKey}`;
        
        try {
            document.getElementById('rover-fetch-btn').innerText = 'LINKING TRANSMISSION...';
            document.getElementById('rover-fetch-btn').disabled = true;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            
            this.photos = data.photos || [];
            this.renderThumbnails();
            
            document.getElementById('rover-fetch-btn').innerText = 'INITIATE ACQUISITION';
            document.getElementById('rover-fetch-btn').disabled = false;
        } catch (err) {
            console.warn('Rover API failed. Using fallback dataset.', err);
            this.photos = this.mockPhotos;
            this.renderThumbnails();
            document.getElementById('rover-fetch-btn').innerText = 'INITIATE ACQUISITION';
            document.getElementById('rover-fetch-btn').disabled = false;
        }
    }

    renderThumbnails() {
        const grid = document.getElementById('rover-gallery-grid');
        const countEl = document.getElementById('rover-count');
        grid.innerHTML = '';
        
        countEl.innerText = `${this.photos.length} IMAGES`;

        if (this.photos.length === 0) {
            grid.innerHTML = `
                <div class="empty-gallery">
                    NO STREAM ON THIS SOL/CAMERA FILTER COMBINATION. Try Sol 1000 on Curiosity NAVCAM.
                </div>`;
            return;
        }

        this.photos.forEach((photo, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'rover-thumb';
            // Set proxy/original image source. We load images securely.
            // Using crossOrigin = "Anonymous" on canvas loading to avoid tainted canvas.
            thumb.innerHTML = `<img src="${photo.img_src}" alt="Mars raw feed" loading="lazy">`;
            
            thumb.addEventListener('click', () => {
                this.container.querySelectorAll('.rover-thumb').forEach(t => t.classList.remove('selected'));
                thumb.classList.add('selected');
                this.loadPhoto(photo);
            });

            grid.appendChild(thumb);
        });

        // Automatically load first photo
        if (this.photos.length > 0) {
            grid.children[0].click();
        }
    }

    loadPhoto(photo) {
        this.activePhoto = photo;
        
        // Update Title
        document.getElementById('viewport-title').innerText = `ROVER FEED // SOL ${photo.sol}`;
        document.getElementById('analysis-placeholder').style.display = 'none';
        this.canvas.style.display = 'block';

        // Update Overlays
        document.getElementById('tel-sol').innerText = photo.sol;
        document.getElementById('tel-date').innerText = photo.earth_date;
        document.getElementById('tel-cam').innerText = photo.camera.full_name;

        if (window.aetherAudio) window.aetherAudio.playClick();

        // Load image into Canvas securely
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = photo.img_src;
        img.onload = () => {
            // Downscale image to a standard processing size (e.g. max 640 width)
            const maxW = 640;
            const ratio = img.height / img.width;
            this.canvas.width = maxW;
            this.canvas.height = Math.round(maxW * ratio);

            // Draw image to Canvas
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

            // Save original image pixel data
            this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            // Re-apply filter
            this.applyFilter();
        };
    }

    setFilter(filter) {
        if (!this.activePhoto) return;
        this.activeFilter = filter;
        if (window.aetherAudio) window.aetherAudio.playClick();
        this.applyFilter();
    }

    applyFilter() {
        if (!this.originalImageData) return;

        // Restore raw pixels first
        this.ctx.putImageData(this.originalImageData, 0, 0);

        if (this.activeFilter === 'original') return;

        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;

        switch (this.activeFilter) {
            case 'hud':
                this.applyHUDShader(data);
                this.ctx.putImageData(imgData, 0, 0);
                this.drawHUDOverlays();
                break;
            case 'nv':
                this.applyNightVisionShader(data);
                this.ctx.putImageData(imgData, 0, 0);
                break;
            case 'thermal':
                this.applyThermalShader(data);
                this.ctx.putImageData(imgData, 0, 0);
                break;
            case 'edges':
                this.applyEdgeShader(imgData);
                break;
        }
    }

    applyNightVisionShader(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            // Standard luminance weights
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Green phosphor simulation
            data[i] = 0;
            data[i+1] = Math.min(255, lum * 1.6 + (Math.random() - 0.5) * 15);
            data[i+2] = 0;
        }
    }

    applyThermalShader(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Map luminance (0-255) to a classic ironbow thermal ramp
            if (lum < 64) {
                // Dark Blue
                data[i] = 0;
                data[i+1] = 0;
                data[i+2] = Math.round(lum * 4);
            } else if (lum < 128) {
                // Indigo/Violet
                data[i] = Math.round((lum - 64) * 4);
                data[i+1] = 0;
                data[i+2] = 255;
            } else if (lum < 192) {
                // Red/Orange
                data[i] = 255;
                data[i+1] = Math.round((lum - 128) * 1.5);
                data[i+2] = Math.round(255 - (lum - 128) * 4);
            } else {
                // Yellow/White
                data[i] = 255;
                data[i+1] = 255;
                data[i+2] = Math.round((lum - 192) * 4);
            }
        }
    }

    applyEdgeShader(imgData) {
        const w = imgData.width;
        const h = imgData.height;
        const data = imgData.data;

        // Allocate output buffer
        const edgeCanvas = document.createElement('canvas');
        edgeCanvas.width = w;
        edgeCanvas.height = h;
        const edgeCtx = edgeCanvas.getContext('2d');
        const outData = edgeCtx.createImageData(w, h);
        const out = outData.data;

        // Perform standard 1D horizontal differential filter (highly responsive edge filter)
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                const nextIdx = (y * w + (x + 1)) * 4;

                const lum = 0.3 * data[idx] + 0.59 * data[idx+1] + 0.11 * data[idx+2];
                const nextLum = 0.3 * data[nextIdx] + 0.59 * data[nextIdx+1] + 0.11 * data[nextIdx+2];

                const diff = Math.abs(lum - nextLum);
                const edgeVal = diff > 20 ? Math.min(255, diff * 3) : 0;

                out[idx] = 0;
                out[idx+1] = edgeVal; // electric green edge line
                out[idx+2] = Math.round(edgeVal * 0.85); // cyan mix
                out[idx+3] = 255; // solid opacity
            }
        }

        // Draw edge array to context
        edgeCtx.putImageData(outData, 0, 0);
        this.ctx.fillStyle = '#04040c'; // Solid cosmic dark bg under lines
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.drawImage(edgeCanvas, 0, 0);
    }

    applyHUDShader(data) {
        // Boost contrast and color tint towards low-res camera feed
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            // Cyan desaturated filter
            const gray = 0.3 * r + 0.59 * g + 0.11 * b;
            data[i] = Math.max(0, Math.min(255, gray * 0.8));
            data[i+1] = Math.max(0, Math.min(255, gray * 1.1));
            data[i+2] = Math.max(0, Math.min(255, gray * 1.25));
        }
    }

    drawHUDOverlays() {
        this.ctx.save();
        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.font = '12px "Share Tech Mono"';
        this.ctx.lineWidth = 1.5;

        // Draw crosshairs
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.beginPath();
        // Centered crosshair
        this.ctx.moveTo(cx - 20, cy);
        this.ctx.lineTo(cx - 5, cy);
        this.ctx.moveTo(cx + 5, cy);
        this.ctx.lineTo(cx + 20, cy);
        this.ctx.moveTo(cx, cy - 20);
        this.ctx.lineTo(cx, cy - 5);
        this.ctx.moveTo(cx, cy + 5);
        this.ctx.lineTo(cx, cy + 20);
        this.ctx.stroke();

        // Draw scan lines
        this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let y = 0; y < this.canvas.height; y += 4) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();

        // Draw mock target detection box (simulated rover hazard analysis)
        // Find high-contrast region dynamically or draw one in lower third (simulated boulder tracking)
        const bx = Math.round(this.canvas.width * 0.3);
        const by = Math.round(this.canvas.height * 0.6);
        const bw = 120;
        const bh = 70;

        this.ctx.strokeStyle = '#ef4444'; // Red hazard tracker
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(bx, by, bw, bh);

        // Reticle corners
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillText('TARGET ACQUIRED: BOULDER_FHAZ_01', bx, by - 8);
        this.ctx.fillText('HAZARD RATIO: 82%', bx, by + bh + 16);

        this.ctx.restore();
    }
}

// Bind to window
window.RoverAnalyzer = RoverAnalyzer;
