// Simple Orbital Dodge game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // Regenerate background stars for new size
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  };
  window.addEventListener('resize', resize);
  resize();
  // Generate background stars
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('pointerdown', resumeAudio, { once: true });

  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game constants
  const PLANET_RADIUS = 30;
  const ORBIT_RADIUS = 120; // distance from planet center
  const SHIP_SIZE = 12; // length of ship triangle
  const ROTATION_STEP = (Math.PI / 12); // 15 degrees per click
  const ASTEROID_MIN_SPEED = 0.7;
  const ASTEROID_MAX_SPEED = 1.5;
  const ASTEROID_SPAWN_INTERVAL = 1500; // ms
  const MAX_LIVES = 3;

  // Game state
  let shipAngle = 0; // angle around planet
  let lives = MAX_LIVES;
  let lastSpawn = 0;
  const asteroids = [];
  let gameOver = false;

  // Helper: distance squared
  const dist2 = (x1, y1, x2, y2) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
  };

  // Ship position (computed each frame)
  const getShipPos = () => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const x = cx + ORBIT_RADIUS * Math.cos(shipAngle);
    const y = cy + ORBIT_RADIUS * Math.sin(shipAngle);
    return { x, y };
  };

  // Asteroid class
  class Asteroid {
    constructor() {
      // Spawn on a random edge
      const edge = Math.floor(Math.random() * 4);
      const margin = 10;
      let x, y, vx, vy;
      const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
      switch (edge) {
        case 0: // top
          x = Math.random() * canvas.width;
          y = -margin;
          break;
        case 1: // right
          x = canvas.width + margin;
          y = Math.random() * canvas.height;
          break;
        case 2: // bottom
          x = Math.random() * canvas.width;
          y = canvas.height + margin;
          break;
        case 3: // left
          x = -margin;
          y = Math.random() * canvas.height;
          break;
      }
      // Aim roughly toward the planet center with a slight random offset for curvature
      const targetX = canvas.width / 2 + (Math.random() - 0.5) * 80;
      const targetY = canvas.height / 2 + (Math.random() - 0.5) * 80;
      const dx = targetX - x;
      const dy = targetY - y;
      const len = Math.hypot(dx, dy);
      vx = (dx / len) * speed;
      vy = (dy / len) * speed;
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = 8 + Math.random() * 6;
      // Random asteroid color
      this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Input: click rotates ship clockwise
  canvas.addEventListener('pointerdown', () => {
    if (gameOver) return;
    shipAngle += ROTATION_STEP;
    // Play short rotate sound
    playSound(400, 0.08);
  });

  // Main loop
  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 16; // normalize to ~60fps units
    lastTime = now;
    if (!gameOver) update(dt, now);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt, now) {
    // Spawn asteroids
    if (now - lastSpawn > ASTEROID_SPAWN_INTERVAL) {
      asteroids.push(new Asteroid());
      lastSpawn = now;
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update(dt);
      // Remove if far off-screen
      if (a.x < -50 || a.x > canvas.width + 50 || a.y < -50 || a.y > canvas.height + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const shipPos = getShipPos();
      if (dist2(a.x, a.y, shipPos.x, shipPos.y) < (a.radius + SHIP_SIZE) ** 2) {
        lives--;
        playSound(200, 0.2); // collision sound
        asteroids.splice(i, 1);
        if (lives <= 0) {
          gameOver = true;
          playSound(100, 0.5); // game over sound
        }
      }
    }
  }

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw background stars
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw planet with gradient
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const planetGrad = ctx.createRadialGradient(cx, cy, PLANET_RADIUS * 0.2, cx, cy, PLANET_RADIUS);
  planetGrad.addColorStop(0, '#4a90e2');
  planetGrad.addColorStop(1, '#0b3d91');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, PLANET_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Draw ship with gradient and slight outline
  const shipPos = getShipPos();
  const shipGrad = ctx.createLinearGradient(-SHIP_SIZE, -SHIP_SIZE, SHIP_SIZE, SHIP_SIZE);
  shipGrad.addColorStop(0, '#ffdd55');
  shipGrad.addColorStop(1, '#ff8800');
  ctx.fillStyle = shipGrad;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.save();
  ctx.translate(shipPos.x, shipPos.y);
  ctx.rotate(shipAngle + Math.PI / 2); // point outward
  ctx.beginPath();
  ctx.moveTo(0, -SHIP_SIZE);
  ctx.lineTo(SHIP_SIZE / 2, SHIP_SIZE);
  ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Draw asteroids (colored already)
  for (const a of asteroids) a.draw();

  // Draw lives HUD
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Lives: ' + lives, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

  // Start loop
  requestAnimationFrame(loop);
})();
