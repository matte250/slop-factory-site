// Simple Space Miner game – targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const state = {
    player: { x: WIDTH / 2, y: HEIGHT - 60, w: 40, h: 20, speed: 4, health: 100, fuel: 100, minerals: 0 },
    laser: { active: false, x: 0, y: 0, w: 2, h: 10, speed: 8 },
    asteroids: [],
    debris: [],
    keys: {},
    lastAsteroid: 0,
    lastRefuel: 0,
    gameOver: false,
    stars: [],
    // Audio context for sound effects
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
  };

  // Simple tone generator
  function playTone(freq, dur) {
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.1, state.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + dur / 1000);
  }

  // Initialize star field
  const STAR_COUNT = 120;
  for (let i = 0; i < STAR_COUNT; i++) {
    state.stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.8 + 0.2,
    });
  }

  // ----- Input -----
  window.addEventListener('keydown', e => {
    state.keys[e.key] = true;
    // Ensure audio context is running after user interaction
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    // Play laser sound on fire key
    if (e.key === ' ' && !state.laser.active) {
      playTone(600, 100);
    }
    // Refuel sound
    if (e.key === 'r' || e.key === 'R') {
      playTone(400, 80);
    }
  });
  window.addEventListener('keyup', e => state.keys[e.key] = false);

  // ----- Helpers -----
  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    state.asteroids.push({ x: Math.random() * (WIDTH - size), y: -size, w: size, h: size, speed: Math.random() * 2 + 1, mined: false });
  }

  function spawnDebris(x, y) {
    for (let i = 0; i < 5; i++) {
      state.debris.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, life: 60 });
    }
  }

  // ----- Game loop -----
  function update(dt) {
    if (state.gameOver) return;

    // Player movement
    if (state.keys['ArrowLeft']) state.player.x -= state.player.speed;
    if (state.keys['ArrowRight']) state.player.x += state.player.speed;
    if (state.keys['ArrowUp']) state.player.y -= state.player.speed;
    if (state.keys['ArrowDown']) state.player.y += state.player.speed;
    // Keep within bounds
    state.player.x = Math.max(0, Math.min(WIDTH - state.player.w, state.player.x));
    state.player.y = Math.max(0, Math.min(HEIGHT - state.player.h, state.player.y));

    // Fire laser
    if (state.keys[' '] && !state.laser.active) {
      state.laser.active = true;
      state.laser.x = state.player.x + state.player.w / 2 - state.laser.w / 2;
      state.laser.y = state.player.y;
    }

    // Refuel
    if (state.keys['r'] || state.keys['R']) {
      if (state.player.fuel < 100) state.player.fuel += 0.5;
    }

    // Update laser
    if (state.laser.active) {
      state.laser.y -= state.laser.speed;
      if (state.laser.y < -state.laser.h) state.laser.active = false;
    }

    // Spawn asteroids every 1.5 s
    if (Date.now() - state.lastAsteroid > 1500) {
      spawnAsteroid();
      state.lastAsteroid = Date.now();
    }

    // Update asteroids
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      a.y += a.speed;
      // Laser hit
      if (state.laser.active && rectCollision(state.laser, a) && !a.mined) {
        a.mined = true;
        state.player.minerals += Math.floor(a.w / 10);
        spawnDebris(a.x + a.w / 2, a.y + a.h / 2);
        state.laser.active = false;
        // Play mining sound
        playTone(800, 120);
      }
      // Collision with ship
if (rectCollision(state.player, a)) {
          state.player.health -= 20;
          // Play collision sound
          playTone(200, 150);
          state.asteroids.splice(i, 1);
          continue;
        }
      // Remove off‑screen
      if (a.y > HEIGHT) state.asteroids.splice(i, 1);
    }

    // Update debris particles (visual only)
    for (let i = state.debris.length - 1; i >= 0; i--) {
      const p = state.debris[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) state.debris.splice(i, 1);
    }

    // Fuel consumption
    state.player.fuel -= 0.02 * dt;
    if (state.player.fuel <= 0) state.player.health = 0;

    // Check lose condition
    if (state.player.health <= 0) {
      state.gameOver = true;
    }
  }

  function draw() {
    // Clear with space background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw star field
    ctx.fillStyle = 'white';
    state.stars.forEach(star => {
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1.0;

    // Draw player ship with gradient and glow
    const shipGrad = ctx.createLinearGradient(state.player.x, state.player.y, state.player.x + state.player.w, state.player.y + state.player.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y + state.player.h);
    ctx.lineTo(state.player.x + state.player.w / 2, state.player.y);
    ctx.lineTo(state.player.x + state.player.w, state.player.y + state.player.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw laser with glow
    if (state.laser.active) {
      const grad = ctx.createLinearGradient(0, state.laser.y, 0, state.laser.y + state.laser.h);
      grad.addColorStop(0, 'rgba(255,0,0,0)');
      grad.addColorStop(0.5, 'rgba(255,0,0,0.8)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'red';
      ctx.fillRect(state.laser.x, state.laser.y, state.laser.w, state.laser.h);
      ctx.shadowBlur = 0;
    }

    // Draw asteroids with radial gradient
    state.asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.1, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw debris particles with fading orange
    state.debris.forEach(p => {
      const alpha = p.life / 60;
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.fillRect(p.x, p.y, 3, 3);
    });

    // HUD with crisp font
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Health: ${Math.max(0, Math.floor(state.player.health))}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(state.player.fuel))}`, 10, 38);
    ctx.fillText(`Minerals: ${state.player.minerals}`, 10, 56);

    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!state.gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
