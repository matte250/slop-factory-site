// game.js - Minimal Asteroid Dodge implementation
// Assumes a <canvas id="game"></canvas> exists in the HTML.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas to full window size
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }
  // Initialize stars for background
  const stars = [];
  function initStars() {
    stars.length = 0;
    const count = Math.floor(canvas.width * canvas.height / 8000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  }
  function drawStars() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  resize();
  window.addEventListener('resize', resize);

  // Player ship
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2,
    y: canvas.height - 60,
    speed: 5,
    boostSpeed: 10,
    boosting: false,
    boostTimer: 0,
    // Draw ship with a cyan gradient and thin outline
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#004');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    update() {
      const s = this.boosting ? this.boostSpeed : this.speed;
      if (keys.ArrowLeft && this.x - this.width / 2 > 0) this.x -= s;
      if (keys.ArrowRight && this.x + this.width / 2 < canvas.width) this.x += s;
      if (this.boosting) {
        this.boostTimer--;
        if (this.boostTimer <= 0) this.boosting = false;
      }
    }
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 90; // frames
  let spawnCounter = 0;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size) + size / 2;
    const speed = Math.random() * 2 + 2;
    asteroids.push({ x, y: -size, size, speed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.size > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision detection
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - ship.y);
      if (dx < (a.size + ship.width) / 2 && dy < (a.size + ship.height) / 2) {
        // Game over - play explosion sound
        playTone(200, 0.3);
        cancelAnimationFrame(animId);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        return;
      }
    }
  }

  function drawAsteroids() {
    // Draw asteroids with radial gradient and thin outline
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.1, a.x, a.y, a.size / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.key === ' ' && !ship.boosting) {
      ship.boosting = true;
      ship.boostTimer = 30; // frames of boost
      playTone(600, 0.07); // boost sound
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  let animId;
  function loop() {
    // Draw dynamic starfield background
    drawStars();
    ship.update();
    ship.draw();

    if (spawnCounter-- <= 0) {
      spawnAsteroid();
      spawnCounter = asteroidSpawnInterval;
    }
    updateAsteroids();
    drawAsteroids();

    animId = requestAnimationFrame(loop);
  }

  // Start the game
  loop();
})();
