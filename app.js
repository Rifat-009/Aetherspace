/* ==========================================================================
   AETHERSPACE MAIN CONTROLLER - HUD NAVIGATION, STATE & INITIALIZATION
   ========================================================================== */

class AetherApp {
    constructor() {
        this.currentView = 'view-orbital';
        this.apiKey = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';
        this.hudMuted = localStorage.getItem('hud_muted') === 'true';
        this.ambientHumEnabled = localStorage.getItem('ambient_hum_enabled') === 'true';

        // Engines
        this.orbitalEngine = null;
        this.roverAnalyzer = null;
        this.apodViewer = null;

        this.init();
    }

    init() {
        // Initialize Icons
        lucide.createIcons();

        // Bind core buttons & DOM
        this.bindNavigation();
        this.bindSettings();
        this.bindAudioToggle();
        
        // Initial setup for Audio context wake on first interaction
        document.body.addEventListener('click', () => {
            if (window.aetherAudio) {
                window.aetherAudio.init();
                if (this.ambientHumEnabled && !this.hudMuted) {
                    window.aetherAudio.startAmbience();
                }
            }
        }, { once: true });

        // Initialize HUD components
        this.initEngines();

        // Display welcome banner
        this.notify('AETHERSPACE HUD COMPILED // LINK ONLINE', 'info');
    }

    initEngines() {
        // 1. Orbital mechanics dashboard
        this.orbitalEngine = new OrbitalEngine('orbital-canvas', 'orbital-telemetry');
        this.orbitalEngine.loadData(this.apiKey);

        // 2. Rover photo analyzer
        this.roverAnalyzer = new RoverAnalyzer('rover-module-container');

        // 3. APOD database
        this.apodViewer = new ApodViewer('apod-module-container');
    }

    bindNavigation() {
        const navButtons = document.querySelectorAll('.hud-nav-btn');
        const views = document.querySelectorAll('.hud-view');

        navButtons.forEach(btn => {
            // Hover sound
            btn.addEventListener('mouseenter', () => {
                if (window.aetherAudio) window.aetherAudio.playHover();
            });

            // Click view switcher
            btn.addEventListener('click', (e) => {
                const targetViewId = btn.getAttribute('data-target');
                if (targetViewId === this.currentView) return;

                if (window.aetherAudio) window.aetherAudio.playClick();

                // Swap navigation classes
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Swap views
                views.forEach(v => v.classList.remove('active'));
                const targetView = document.getElementById(targetViewId);
                if (targetView) targetView.classList.add('active');

                this.currentView = targetViewId;

                // Fire refresh/resizes for canvas layout when visible
                if (targetViewId === 'view-orbital' && this.orbitalEngine) {
                    this.orbitalEngine.resize();
                }

                this.notify(`ROUTING TO PORT: ${targetViewId.replace('view-', '').toUpperCase()}`);
            });
        });
    }

    bindSettings() {
        const modal = document.getElementById('settings-modal');
        const openBtn = document.getElementById('hud-settings-toggle');
        const closeBtn = document.getElementById('settings-close');
        const saveBtn = document.getElementById('settings-save-btn');
        const keyInput = document.getElementById('api-key-input');
        const humToggle = document.getElementById('ambient-hum-toggle');

        // Load current config values
        keyInput.value = this.apiKey === 'DEMO_KEY' ? '' : this.apiKey;
        humToggle.checked = this.ambientHumEnabled;

        // Toggle Open
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
            if (window.aetherAudio) window.aetherAudio.playClick();
        });

        // Toggle Close
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            if (window.aetherAudio) window.aetherAudio.playClick();
        });

        // Close on backing click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Save settings
        saveBtn.addEventListener('click', () => {
            const keyVal = keyInput.value.trim();
            const prevKey = this.apiKey;
            this.apiKey = keyVal || 'DEMO_KEY';
            localStorage.setItem('nasa_api_key', this.apiKey);

            this.ambientHumEnabled = humToggle.checked;
            localStorage.setItem('ambient_hum_enabled', this.ambientHumEnabled ? 'true' : 'false');

            // Handle Ambience toggle
            if (window.aetherAudio) {
                if (this.ambientHumEnabled && !this.hudMuted) {
                    window.aetherAudio.startAmbience();
                } else {
                    window.aetherAudio.stopAmbience();
                }
            }

            modal.classList.remove('active');
            if (window.aetherAudio) window.aetherAudio.playClick();

            this.notify('HUD CONFIGURATION CALIBRATED');

            // If API key changed, refresh components
            if (prevKey !== this.apiKey) {
                this.notify('RELOADING CORE DATA STREAM...');
                if (this.orbitalEngine) this.orbitalEngine.loadData(this.apiKey);
                if (this.apodViewer) {
                    const today = new Date().toISOString().split('T')[0];
                    this.apodViewer.fetchApod(today);
                }
            }
        });
    }

    bindAudioToggle() {
        const toggleBtn = document.getElementById('hud-audio-toggle');
        
        // Setup initial audio icon states
        this.updateAudioIcon();

        toggleBtn.addEventListener('click', () => {
            this.hudMuted = !this.hudMuted;
            if (window.aetherAudio) {
                window.aetherAudio.setMuted(this.hudMuted);
                if (!this.hudMuted) {
                    // Trigger sound to confirm unmute
                    window.aetherAudio.playClick();
                }
            }
            this.updateAudioIcon();
            this.notify(this.hudMuted ? 'HUD SOUND TRANSMISSIONS OFF' : 'HUD SOUND TRANSMISSIONS ONLINE');
        });
    }

    updateAudioIcon() {
        const toggleBtn = document.getElementById('hud-audio-toggle');
        if (this.hudMuted) {
            toggleBtn.innerHTML = '<i data-lucide="volume-x"></i>';
            toggleBtn.classList.remove('text-cyan');
        } else {
            toggleBtn.innerHTML = '<i data-lucide="volume-2"></i>';
            toggleBtn.classList.add('text-cyan');
        }
        lucide.createIcons();
    }

    notify(text, type = 'info') {
        const toast = document.getElementById('hud-notification');
        const textEl = document.getElementById('notify-text-inner');
        const iconEl = document.getElementById('notify-icon-inner');

        textEl.innerText = text.toUpperCase();

        if (type === 'warning') {
            iconEl.setAttribute('data-lucide', 'alert-triangle');
            toast.style.borderColor = 'var(--neon-amber)';
            if (window.aetherAudio) window.aetherAudio.playWarning();
        } else {
            iconEl.setAttribute('data-lucide', 'bell');
            toast.style.borderColor = 'var(--neon-cyan)';
        }

        lucide.createIcons();
        toast.classList.add('active');

        // Automatic dismiss
        clearTimeout(this.notifyTimeout);
        this.notifyTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 3500);
    }
}

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
    window.aetherApp = new AetherApp();
});
