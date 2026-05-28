// Simple Asteroid Dodge game
// Canvas element with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Create star field for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // Player ship with triangular shape
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.width, this.x + this.speed);
    },
    draw() {
      // Draw ship as an upward-pointing triangle
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroid class
  class Asteroid {
    constructor() {
      this.radius = Math.random() * 15 + 10; // 10-25px
      this.x = Math.random() * (width - this.radius * 2) + this.radius;
      this.y = -this.radius;
      this.speed = Math.random() * 2 + 1; // 1-3 px per frame
    }
    update() {
      this.y += this.speed;
    }
    draw() {
      // Draw asteroid with radial gradient for depth
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    isOffScreen() {
      return this.y - this.radius > height;
    }
  }

  let asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 60; // frames
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    asteroids.push(new Asteroid());
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - Math.max(ship.x, Math.min(a.x, ship.x + ship.width));
      const dy = a.y - Math.max(ship.y, Math.min(a.y, ship.y + ship.height));
      if (dx * dx + dy * dy < a.radius * a.radius) {
        return true;
      }
    }
    return false;
  }

  function update() {
    if (gameOver) return;
    // Fill background with dark space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Update and draw stars for a parallax effect
    ctx.fillStyle = '#fff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ship.update();
    ship.draw();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();
      a.draw();
      if (a.isOffScreen()) {
        asteroids.splice(i, 1);
        score++;
        // Play score beep
        playBeep(600, 80);
      }
    }

    // Spawn new asteroids
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }

    // Collision check
if (checkCollision()) {
        // Play crash sound
        playBeep(200, 300);
        gameOver = true;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
      return;
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);

    requestAnimationFrame(update);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = false;
  });

  // Start the game loop
  update();
})();
