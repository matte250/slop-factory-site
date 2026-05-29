// Simple Canvas Escape game – enhanced graphics
// Assumes a <canvas id="game"></canvas> exists in the page

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed after user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', resumeAudio, {once: true});
window.addEventListener('click', resumeAudio, {once: true});

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Simple explosion / crash sound
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150; // low freq boom
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  // Set canvas size to fill window (adjustable)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // --- Star field background ---
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed; // move left to give parallax feel
      if (s.x < 0) s.x = canvas.width;
    }
  }

  const ship = {
    w: 40,
    h: 30,
    x: 80,
    y: canvas.height / 2 - 15,
    speed: 5,
    // Gradient fill for a sleek look
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#060');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      // vertical movement bounded by canvas
      if (keys.up) this.y = Math.max(0, this.y - this.speed);
      if (keys.down) this.y = Math.min(canvas.height - this.h, this.y + this.speed);
    }
  };

  const keys = { up: false, down: false };
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') { keys.up = true; playTone(600, 0.08); }
    if (e.code === 'ArrowDown') { keys.down = true; playTone(600, 0.08); }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'ArrowDown') keys.down = false;
  });

  class Asteroid {
    constructor() {
      this.r = Math.random() * 15 + 10; // radius
      this.x = canvas.width + this.r;
      this.y = Math.random() * (canvas.height - this.r * 2) + this.r;
      this.speed = Math.random() * 2 + 2; // 2-4 pixels per frame
      // Random gray shade for variation
      const shade = Math.floor(Math.random() * 80) + 120;
      this.baseColor = `rgb(${shade},${shade},${shade})`;
    }
    update() {
      this.x -= this.speed;
    }
    draw() {
      // Radial gradient for a glowing asteroid effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, 'rgba(255,255,255,0.8)');
      grad.addColorStop(0.4, this.baseColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() {
      return this.x + this.r < 0;
    }
  }

  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1200; // ms
  let gameOver = false;
  let startTime = null;
  let score = 0;

  function checkCollision(a) {
    // Simple circle-rect collision
    const distX = Math.abs(a.x - (ship.x + ship.w / 2));
    const distY = Math.abs(a.y - (ship.y + ship.h / 2));
    if (distX > (ship.w / 2 + a.r)) return false;
    if (distY > (ship.h / 2 + a.r)) return false;
    if (distX <= (ship.w / 2)) return true;
    if (distY <= (ship.h / 2)) return true;
    const dx = distX - ship.w / 2;
    const dy = distY - ship.h / 2;
    return (dx * dx + dy * dy <= (a.r * a.r));
  }

  function update(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - lastSpawn;
    if (delta > spawnInterval) {
      asteroids.push(new Asteroid());
      lastSpawn = timestamp;
    }

    // Draw animated background
    drawStars();

    ship.update();
    ship.draw();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();
      a.draw();
if (checkCollision(a)) {
          gameOver = true;
          playExplosion();
        }
      if (a.offScreen()) asteroids.splice(i, 1);
    }

    // Score is time survived in seconds
    if (!gameOver) {
      score = Math.floor((timestamp - startTime) / 1000);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}s`, 10, 30);
      requestAnimationFrame(update);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f55';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Survived: ${score}s`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  requestAnimationFrame(update);
})();
