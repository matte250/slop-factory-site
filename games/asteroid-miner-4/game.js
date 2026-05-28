// Simple Asteroid Miner game – works with a <canvas id="game"></canvas>

(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');

    // ------- Configuration -------
    const WIDTH = canvas.width = 800;
    const HEIGHT = canvas.height = 600;
    const SHIP_SPEED = 5;
    const LASER_SPEED = 7;
    const ASTEROID_SPEED = 2;
    const SPAWN_INTERVAL = 1500; // ms
    const TARGET_ORE = 100;
    const MAX_LIVES = 3;
    const STAR_COUNT = 100; // background stars
    const particles = []; // explosion particles
    const stars = []; // starfield positions
    // ------- Audio Setup -------
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, duration) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
        osc.start(audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
        osc.stop(audioCtx.currentTime + duration/1000);
    }
    function playLaserSound(){ playTone(800, 100); }
    function playExplosionSound(){ playTone(150, 300); }
    function playGameOverSound(){ playTone(100, 500); }
    function playWinSound(){ playTone(600, 200); }

    // ------- Game State -------
    let ship, lasers = [], asteroids = [], ore = 0, lives = MAX_LIVES, lastSpawn = 0, gameOver = false;

    // ------- Helper Functions -------
    const rand = (min, max) => Math.random() * (max - min) + min;
    const rectIntersect = (a, b) => !(a.x > b.x + b.w ||
                                      a.x + a.w < b.x ||
                                      a.y > b.y + b.h ||
                                      a.y + a.h < b.y);

    // ------- Entities -------
    class Ship {
        constructor() {
            this.w = 40;
            this.h = 20;
            this.x = WIDTH / 2 - this.w / 2;
            this.y = HEIGHT - this.h - 10;
            this.color = '#0ff';
        }
        move(dx) {
            this.x = Math.max(0, Math.min(WIDTH - this.w, this.x + dx));
        }
        draw() {
            // ship with simple gradient for depth
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
            grad.addColorStop(0, '#0ff');
            grad.addColorStop(1, '#004');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.h);
            ctx.lineTo(this.x + this.w / 2, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h);
            ctx.closePath();
            ctx.fill();
        }
    }

    class Laser {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 2;
            this.h = 10;
            this.color = '#f00';
        }
        update() {
            this.y -= LASER_SPEED;
        }
        draw() {
            // laser with glow effect
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
            grad.addColorStop(0, '#ff5555');
            grad.addColorStop(1, '#550000');
            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }

    class Asteroid {
        constructor() {
            this.r = rand(15, 30);
            this.x = rand(this.r, WIDTH - this.r);
            this.y = -this.r;
            this.speed = ASTEROID_SPEED;
            this.color = '#555';
        }
        update() {
            this.y += this.speed;
        }
        draw() {
            // radial gradient for 3D effect
            const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.3, this.x, this.y, this.r);
            grad.addColorStop(0, '#777');
            grad.addColorStop(1, this.color);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ------- Particle effect for explosions -------
    function spawnExplosion(x, y, size) {
        const count = Math.max(8, Math.floor(size / 4));
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 2 + 0.5,
                life: Math.random() * 30 + 30,
                color: `hsl(${Math.random() * 40}, 100%, 60%)`
            });
        }
    }

    // ------- Input -------
    const keys = {};
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup',   e => keys[e.code] = false);

    // ------- Game Loop -------
    function init() {
        // Initialize starfield
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * WIDTH,
                y: Math.random() * HEIGHT,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.5 + 0.5
            });
        }
        ship = new Ship();
        requestAnimationFrame(loop);
    }

    function loop(timestamp) {
        if (gameOver) {
            drawOverlay();
            return;
        }

        // ---- Clear and background ----
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        bgGrad.addColorStop(0, '#001');
        bgGrad.addColorStop(1, '#000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // ---- Draw stars ----
        ctx.fillStyle = 'white';
        for (const s of stars) {
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // ---- Ship movement ----
        if (keys['ArrowLeft'])  ship.move(-SHIP_SPEED);
        if (keys['ArrowRight']) ship.move(SHIP_SPEED);
        ship.draw();

        // ---- Shooting ----
        if (keys['Space']) {
            // simple debounce: fire only if no laser at ship's tip
            if (!lasers.some(l => l.y < ship.y)) {
                lasers.push(new Laser(ship.x + ship.w / 2 - 1, ship.y));
                playLaserSound();
            }
        }

        // ---- Update lasers ----
        lasers.forEach(l => l.update());
        lasers = lasers.filter(l => l.y + l.h > 0);
        lasers.forEach(l => l.draw());

        // ---- Spawn asteroids ----
        if (timestamp - lastSpawn > SPAWN_INTERVAL) {
            asteroids.push(new Asteroid());
            lastSpawn = timestamp;
        }

        // ---- Update asteroids ----
        asteroids.forEach(a => a.update());
        asteroids = asteroids.filter(a => a.y - a.r < HEIGHT);
        asteroids.forEach(a => a.draw());

        // ---- Update and draw particles ----
        ctx.fillStyle = 'orange';
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            ctx.globalAlpha = Math.max(p.life / 60, 0);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        }
        ctx.globalAlpha = 1;

        // ---- Collision: Laser ↔ Asteroid ----
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const a = asteroids[i];
            for (let j = lasers.length - 1; j >= 0; j--) {
                const l = lasers[j];
                const laserBox = {x: l.x, y: l.y, w: l.w, h: l.h};
                const asteroidBox = {x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2};
                if (rectIntersect(laserBox, asteroidBox)) {
                    // Collect ore and remove both
                    ore += Math.round(a.r);
                    // create explosion particles
                    spawnExplosion(a.x, a.y, a.r);
                    lasers.splice(j, 1);
                    asteroids.splice(i, 1);
                    break;
                }
            }
        }

        // ---- Collision: Ship ↔ Asteroid (lose life) ----
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const a = asteroids[i];
            const shipBox = {x: ship.x, y: ship.y, w: ship.w, h: ship.h};
            const asteroidBox = {x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2};
            if (rectIntersect(shipBox, asteroidBox)) {
                lives--;
                asteroids.splice(i, 1);
                // play explosion sound on hit
                playExplosionSound();
                if (lives <= 0) {
                    gameOver = true;
                }
            }
        }

        // ---- UI ----
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText(`Ore: ${ore} / ${TARGET_ORE}`, 10, 20);
        ctx.fillText(`Lives: ${lives}`, 10, 40);

        // ---- Win / Lose check ----
        if (ore >= TARGET_ORE) {
            gameOver = true;
            playWinSound();
            drawOverlay('WIN');
        } else if (lives <= 0) {
            gameOver = true;
            playGameOverSound();
            drawOverlay('LOSE');
        } else {
            requestAnimationFrame(loop);
        }
    }

    function drawOverlay(state) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        const msg = state === 'WIN' ? 'You Win!' : state === 'LOSE' ? 'Game Over' : 'Game Over';
        ctx.fillText(msg, WIDTH / 2, HEIGHT / 2);
        ctx.font = '20px monospace';
        ctx.fillText(`Ore collected: ${ore}`, WIDTH / 2, HEIGHT / 2 + 40);
    }

    // Start the game
    init();
})();
