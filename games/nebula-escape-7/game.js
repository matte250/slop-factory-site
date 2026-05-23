// Simple top‑down canvas game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height * 0.8,
    radius: 12,
    speed: 2,
    fuel: 100,
    angle: 0, // radians, 0 = up
    color: '#0ff',
  };

  const asteroids = [];
  const fuels = [];
// Starfield background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
  });
}
  let distance = 0;
  let gameOver = false;

  // Input handling (left/right arrow)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const radius = 8 + Math.random() * 12;
    asteroids.push({
      x: Math.random() * width,
      y: -radius,
      radius,
      speed: 1 + Math.random() * 2,
      color: '#888',
    });
  }

  function spawnFuel() {
    const size = 6;
    fuels.push({
      x: Math.random() * width,
      y: -size,
      size,
      speed: 1.5,
      color: '#ff0',
    });
  }

  function update() {
    if (gameOver) return;

    // Player movement and tilt
    let moved = false;
    if (keys.ArrowLeft) {
      ship.x -= ship.speed;
      ship.angle = -0.2;
      moved = true;
    } else if (keys.ArrowRight) {
      ship.x += ship.speed;
      ship.angle = 0.2;
      moved = true;
    } else {
      // gradually level out
      ship.angle *= 0.9;
    }
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));

    // Play thrust sound when moving
    if (moved) playTone(220, 0.05);

    // Consume fuel
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) ship.fuel = 0;

    // Update starfield (slow drift)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.3; // drift downwards
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Update fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.size > height) fuels.splice(i, 1);
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.radius + ship.radius) {
        gameOver = true;
        playTone(80, 0.4); // explosion sound
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
      if (Math.hypot(dx, dy) < f.size + ship.radius) {
        ship.fuel = Math.min(100, ship.fuel + 20);
        fuels.splice(i, 1);
        playTone(880, 0.1); // fuel collect
      }
    }

    distance += ship.speed;

    // Spawn new objects periodically
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();
  }

  function draw() {
    // Space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship as triangle pointing up
    ctx.fillStyle = ship.color;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.6, ship.radius);
    ctx.lineTo(-ship.radius * 0.6, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids with subtle shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw fuel cells as glowing circles
    for (const f of fuels) {
      const radGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
      radGrad.addColorStop(0, 'rgba(255,255,0,0.8)');
      radGrad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 20);
    ctx.fillText(`Dist: ${Math.floor(distance)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game when the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(loop));
  } else {
    requestAnimationFrame(loop);
  }
})();
