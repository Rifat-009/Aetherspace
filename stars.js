class Starfield {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.meteors = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        
        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        this.resize();
        this.stars = [];
        const starCount = Math.floor((this.canvas.width * this.canvas.height) / 6000);
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5,
                alpha: Math.random(),
                speed: 0.005 + Math.random() * 0.015,
                color: this.getRandomColor()
            });
        }
    }

    getRandomColor() {
        const colors = [
            'rgba(147, 197, 253, alpha)', // soft blue
            'rgba(233, 213, 255, alpha)', // soft purple
            'rgba(165, 243, 252, alpha)', // soft cyan
            'rgba(255, 255, 255, alpha)'  // white
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.init());
        window.addEventListener('mousemove', (e) => {
            // Normalize mouse position around center
            this.targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
            this.targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
        });
    }

    spawnMeteor() {
        if (Math.random() > 0.993 && this.meteors.length < 3) {
            this.meteors.push({
                x: Math.random() * this.canvas.width * 0.8,
                y: 0,
                length: 40 + Math.random() * 80,
                speed: 8 + Math.random() * 12,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.1,
                opacity: 1,
                width: 1 + Math.random() * 1.5
            });
        }
    }

    animate() {
        // Smoothly interpolate mouse position for inertia parallax
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;

        this.ctx.fillStyle = 'rgba(4, 4, 12, 0.25)'; // slight trail for meteor streaks
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw and update stars
        this.stars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) {
                star.speed = -star.speed;
            }
            
            // Apply mouse parallax (distant stars move less)
            const px = star.x - this.mouseX * (star.size * 0.5);
            const py = star.y - this.mouseY * (star.size * 0.5);

            // Wrap coordinates around screen boundaries
            let finalX = (px + this.canvas.width) % this.canvas.width;
            let finalY = (py + this.canvas.height) % this.canvas.height;

            this.ctx.fillStyle = star.color.replace('alpha', Math.max(0.1, star.alpha));
            this.ctx.beginPath();
            this.ctx.arc(finalX, finalY, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Spawn & animate meteors
        this.spawnMeteor();
        this.meteors = this.meteors.filter(meteor => {
            meteor.x += Math.cos(meteor.angle) * meteor.speed;
            meteor.y += Math.sin(meteor.angle) * meteor.speed;
            meteor.opacity -= 0.015;

            if (meteor.opacity <= 0 || meteor.x > this.canvas.width || meteor.y > this.canvas.height) {
                return false;
            }

            const gradient = this.ctx.createLinearGradient(
                meteor.x, meteor.y, 
                meteor.x - Math.cos(meteor.angle) * meteor.length, 
                meteor.y - Math.sin(meteor.angle) * meteor.length
            );
            gradient.addColorStop(0, `rgba(6, 182, 212, ${meteor.opacity})`);
            gradient.addColorStop(0.5, `rgba(139, 92, 246, ${meteor.opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = meteor.width;
            this.ctx.beginPath();
            this.ctx.moveTo(meteor.x, meteor.y);
            this.ctx.lineTo(
                meteor.x - Math.cos(meteor.angle) * meteor.length,
                meteor.y - Math.sin(meteor.angle) * meteor.length
            );
            this.ctx.stroke();
            return true;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM loads
window.addEventListener('DOMContentLoaded', () => {
    new Starfield('starfield');
});
