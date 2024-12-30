document.addEventListener("DOMContentLoaded", () => {
    // Initialize Particles.js
    particlesJS.load('particles-js', '/static/js/particles.json', function () {
        console.log('Particles.js loaded');
    });

    // Update canvas size dynamically
    window.addEventListener("resize", () => {
        const particlesCanvas = document.getElementById("particles-js");
        if (particlesCanvas) {
            particlesCanvas.style.width = `${window.innerWidth}px`;
            particlesCanvas.style.height = `${window.innerHeight}px`;
        }
    });
});


const canvas = document.getElementById("background-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particles = [];

class Particle {
    constructor(x, y, size, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.1) this.size -= 0.1;
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push(
            new Particle(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 5 + 1,
                Math.random() * 3 - 1.5,
                Math.random() * 3 - 1.5,
                `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`
            )
        );
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.size <= 0.1) particles.splice(index, 1);
    });
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();
