# AetherSpace // Cosmic HUD Tracker

A next-generation, high-performance, client-side space exploration dashboard. Designed to resemble a sci-fi spacecraft control console, the application features canvas-based orbital radar systems, custom retro-telemetry image-processing shaders, and a real-time web audio synthesizer.

Built entirely with standard HTML5, CSS3, and JavaScript, the application has **zero build dependencies** and is fully optimized for desktop, tablet, and mobile devices (iOS & Android).

---

## 🌌 Core Modules & Tech Stack

### 1. Parallax Starfield (`js/stars.js`)
* **Technology**: HTML5 Canvas (2D Context).
* **Behavior**: Renders a dynamic star field with individualized twinkling speeds and depths. Translates mouse coordinates to parallax shift vectors to simulate depth. Periodically launches meteor streaks with fading linear gradients.

### 2. Audio Synthesizer Engine (`js/audio.js`)
* **Technology**: Web Audio API.
* **Sound Design**:
  * **Clicks**: Frequency-decaying triangle waves.
  * **Hovers**: Ultra-short sine wave blips.
  * **Radar Sweeps**: Sawtooth waves sweeping from 200Hz to 800Hz with a low-pass filter to emulate warm retro-futuristic sonar.
  * **Ambient Hum**: Double oscillator generating 55Hz and 110Hz harmonics to simulate a deep engine room rumble.

### 3. Orbital Asteroid Radar (`js/orbital.js`)
* **Technology**: HTML5 Canvas, NASA Near-Earth Object Web Service (NeoWs) API.
* **Features**:
  * Renders close-approaching asteroids relative to Earth (center) in real-time.
  * Dashed concentric HUD circles denote astronomical distances.
  * Full touch-drag panning and scroll-wheel zoom support.
  * Hovering/clicking asteroids links a tracking vector line and loads comprehensive telemetry parameters (diameter, velocity, miss distance, hazard risk).

### 4. Mars Telemetry & Pixel Shaders (`js/rover.js`)
* **Technology**: HTML5 Canvas, NASA Mars Rover Photos API.
* **Custom Shaders (Canvas ImageData Manipulation)**:
  * **RAW**: Unfiltered Martian photography.
  * **HUD Telemetry**: Contrast boost, cyan desaturating tint, scanline raster overlay, and simulated target-bounding boxes identifying hazards.
  * **Night Vision**: Green phosphor translation with animated pixel noise.
  * **Thermal**:ironbow color-ramp mapping representing temperature values.
  * **Edges**: 1D horizontal differential high-pass filter revealing high-contrast topological details (glowing cyan borders).

### 5. Cosmic Database (`js/apod.js`)
* **Technology**: NASA Astronomy Picture of the Day (APOD) API.
* **Features**: Accesses NASA's imagery database. Features a calendar picker to search previous dates and displays high-definition video embed supports and description cards.

---

## 📂 File Architecture

```
aetherspace/
│
├── index.html          # Core layout, modals, headers and script bindings
├── styles.css          # Design system, CSS variables, glassmorphic panels & overlays
├── app.js              # State manager, view router, configuration loader
│
└── js/
    ├── stars.js        # Starfield canvas backplate
    ├── audio.js        # Synthesized sound effects (Web Audio API)
    ├── orbital.js      # Asteroid tracking radar (NeoWs API)
    ├── rover.js        # Mars Rover photo deck and pixel-manipulating canvas
    └── apod.js         # NASA Astronomy Picture of the Day database
```

---

## 🔧 Installation & How to Run

Because the application is completely client-side, it does not require an installation step or Node modules.

### Option A: Local Browser Launch
Double-click or drag **`index.html`** into any modern web browser.
* *Note: Certain browsers restrict canvas pixel manipulation (`getImageData`) on local `file://` files due to CORS safety regulations. If the Mars Rover shaders do not load, please use Option B.*

### Option B: Local Web Server (Recommended)
Launch a local server from the root of the project:

```bash
# Using Python:
python -m http.server 8000

# Using Node / npm:
npx http-server -p 8000
```
Open your browser and navigate to `http://localhost:8000`.

---

## 🔑 NASA API Configuration

By default, the application runs on NASA's `DEMO_KEY` (limited to 30 requests per hour). 

To remove limits:
1. Obtain a free NASA API key in 10 seconds at [api.nasa.gov](https://api.nasa.gov/).
2. Open the **System Settings** panel (gear icon) in the top-right corner of the app.
3. Paste your key and click **Save & Calibrate**. The key will be saved securely to your browser's `localStorage` and automatically loaded in future sessions.

*If APIs are blocked or rate-limited, the system automatically runs on fallback local datasets to guarantee full visual interactivity.*

---

## 🚀 Deploying to GitHub Pages

To make this site publicly accessible on the web for free:

1. Create a new empty repository on your GitHub account.
2. In your local project directory, run:
   ```bash
   git init
   git add .
   git commit -m "Deploying AetherSpace Cockpit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. Navigate to your repository page on GitHub:
   * Go to **Settings** -> **Pages**.
   * Under **Build and deployment**, select **Deploy from a branch**.
   * Choose **`main`** branch (folder `/root`) and click **Save**.
4. Your site will be online shortly at:
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

## 🛡️ License

This project is open-source under the MIT License. Data feeds are provided by NASA Open APIs. Unsplash images used for mock simulations.
