class AetherAudio {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('hud_muted') === 'true';
        this.ambienceOsc = null;
        this.ambienceGain = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playHover() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    playScan() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        // Lowpass filter for retro-sci-fi warm sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playWarning() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.4);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.4);
    }

    startAmbience() {
        if (this.muted) return;
        this.init();
        if (!this.ctx || this.ambienceOsc) return;

        const now = this.ctx.currentTime;
        this.ambienceOsc = this.ctx.createOscillator();
        this.ambienceGain = this.ctx.createGain();

        this.ambienceOsc.type = 'sine';
        // Deep spacecraft background rumble (55Hz and 110Hz harmonics)
        this.ambienceOsc.frequency.setValueAtTime(55, now);

        this.ambienceGain.gain.setValueAtTime(0.015, now);

        // Add filter to smooth it out
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, now);

        this.ambienceOsc.connect(filter);
        filter.connect(this.ambienceGain);
        this.ambienceGain.connect(this.ctx.destination);

        this.ambienceOsc.start();
    }

    stopAmbience() {
        if (this.ambienceOsc) {
            try {
                this.ambienceOsc.stop();
            } catch (e) {}
            this.ambienceOsc.disconnect();
            this.ambienceOsc = null;
            this.ambienceGain = null;
        }
    }

    setMuted(muted) {
        this.muted = muted;
        localStorage.setItem('hud_muted', muted ? 'true' : 'false');
        if (muted) {
            this.stopAmbience();
        } else {
            this.startAmbience();
        }
    }
}

// Global audio instance
window.aetherAudio = new AetherAudio();
