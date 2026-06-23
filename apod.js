class ApodViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.init();
    }

    init() {
        this.renderLayout();
        this.bindEvents();
        
        // Initial load
        const today = new Date().toISOString().split('T')[0];
        this.fetchApod(today);
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="apod-layout">
                <!-- Main APOD view area -->
                <div class="panel glass-panel apod-main-panel relative">
                    <div class="panel-header flex justify-between items-center">
                        <div>
                            <span class="panel-tag">COSMIC DATABASE</span>
                            <h2 id="apod-title">LOADING STREAM...</h2>
                        </div>
                        <div class="flex items-center gap-4">
                            <label class="font-mono text-xs">CHRONO-COORDINATES</label>
                            <input type="date" id="apod-date-picker" class="hud-date-input">
                        </div>
                    </div>
                    <div class="panel-body flex items-center justify-center relative overflow-hidden" id="apod-media-container">
                        <div class="hud-loader" id="apod-loader">
                            <div class="loader-spinner"></div>
                            <span class="font-mono text-xs mt-2 text-cyan">ESTABLISHING ENCRYPTED LINK...</span>
                        </div>
                        <!-- Images/videos will render here -->
                        <div id="apod-display-wrapper" class="apod-display-wrapper" style="display: none;">
                            <img id="apod-img" src="" alt="APOD Stream" style="display: none;">
                            <div id="apod-video-container" style="display: none;" class="video-container">
                                <iframe id="apod-iframe" src="" frameborder="0" allowfullscreen></iframe>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Explanation HUD card -->
                <div class="panel glass-panel apod-detail-panel">
                    <div class="panel-header">
                        <span class="panel-tag">HISTORICAL DATA LOG</span>
                        <h3 class="text-indigo font-semibold font-mono">MISSION BRIEFING</h3>
                    </div>
                    <div class="panel-body">
                        <div class="metadata-row flex justify-between mb-4 pb-2 border-b border-white-10 font-mono text-xs">
                            <div>SOURCE: <span id="apod-copyright" class="text-cyan">PUBLIC DOMAIN</span></div>
                            <div>TIMESTAMP: <span id="apod-date-str" class="text-cyan">--</span></div>
                        </div>
                        <div class="log-textbox scrollable">
                            <p id="apod-explanation" class="text-sm font-light leading-relaxed">
                                Awaiting transmission logs...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const datePicker = document.getElementById('apod-date-picker');
        
        // Set maximum selectable date to today
        const today = new Date().toISOString().split('T')[0];
        datePicker.max = today;
        datePicker.value = today;

        datePicker.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
                if (window.aetherAudio) window.aetherAudio.playScan();
                this.fetchApod(selectedDate);
            }
        });
    }

    async fetchApod(dateStr) {
        const apiKey = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';
        const url = `https://api.nasa.gov/planetary/apod?date=${dateStr}&api_key=${apiKey}`;

        const loader = document.getElementById('apod-loader');
        const wrapper = document.getElementById('apod-display-wrapper');
        
        loader.style.display = 'flex';
        wrapper.style.display = 'none';

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('API fetch error');
            const data = await response.json();
            this.renderApod(data);
        } catch (error) {
            console.warn('NASA APOD API rate-limited or offline. Loading fallback data.', error);
            this.renderMockApod(dateStr);
        }
    }

    renderApod(data) {
        const loader = document.getElementById('apod-loader');
        const wrapper = document.getElementById('apod-display-wrapper');
        const img = document.getElementById('apod-img');
        const videoContainer = document.getElementById('apod-video-container');
        const iframe = document.getElementById('apod-iframe');

        loader.style.display = 'none';
        wrapper.style.display = 'flex';

        // Set Title, Explanation, Date, Copyright
        document.getElementById('apod-title').innerText = data.title.toUpperCase();
        document.getElementById('apod-explanation').innerText = data.explanation;
        document.getElementById('apod-date-str').innerText = data.date;
        document.getElementById('apod-copyright').innerText = (data.copyright || 'NASA/ESA PUBLIC').toUpperCase();

        if (data.media_type === 'image') {
            videoContainer.style.display = 'none';
            iframe.src = '';
            img.style.display = 'block';
            img.src = data.hdurl || data.url;
        } else if (data.media_type === 'video') {
            img.style.display = 'none';
            img.src = '';
            videoContainer.style.display = 'block';
            
            // Format video URL to enable autoplay/muted if it's YouTube
            let videoUrl = data.url;
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1&mute=1';
            }
            iframe.src = videoUrl;
        }
    }

    renderMockApod(dateStr) {
        // Fallback offline mock APODs depending on day odd/even parity
        const isEven = parseInt(dateStr.split('-')[2] || '0') % 2 === 0;

        const mockData = isEven ? {
            title: 'NGC 2244: The Star Cluster in the Rosette Nebula',
            explanation: 'In the heart of the Rosette Nebula lies a bright cluster of open stars that lights up the surrounding gas. Known as NGC 2244, these stars formed only a few million years ago from the surrounding dust lanes. The stellar winds and radiation of these massive hot stars carve out a distinct bubble at the center of the nebula, exciting the surrounding gas to emit light across various wavelengths.',
            date: dateStr,
            copyright: 'NASA Deep Sky Team',
            media_type: 'image',
            url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80'
        } : {
            title: 'Pillars of Creation Remastered',
            explanation: 'The Hubble and JWST space telescopes combined their views to reveal these towering columns of interstellar gas and dust. Located in the Eagle Nebula, roughly 6,500 light-years away, these columns act as active stellar nurseries. The dense pockets of gas are collapsing under their own gravity, triggering nuclear fusion and birthing new stars.',
            date: dateStr,
            copyright: 'Hubble & JWST Heritage Collaboration',
            media_type: 'image',
            url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1200&q=80'
        };

        this.renderApod(mockData);
    }
}

// Bind to window
window.ApodViewer = ApodViewer;
