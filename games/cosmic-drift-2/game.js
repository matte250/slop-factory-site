// Simple endless runner game based on IDEA.md
// Targets a <canvas id="game"></canvas> element in the HTML page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function initAudio() {
    if (audioInitialized) return;
    audioCtx.resume();
    audioInitialized = true;
  }
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
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Game state
  const state = {
    // Star field for background
    stars: Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    })),
    player: { x: width / 2, y: height - 60, w: 30, h: 40, speed: 0, vx: 0, vy: 0, fuel: 100 },
    keys: {},
    asteroids: [],
    orbs: [],
    lastAsteroid: 0,
    lastOrb: 0,
    running: true,
  };

  // Input handling
  window.addEventListener('keydown', (e) => { state.keys[e.key] = true; initAudio(); });
  window.addEventListener('keyup', (e) => (state.keys[e.key] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    state.asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size / 2,
      speed: 2 + Math.random() * 2,
    });
  }

  function spawnOrb() {
    const r = 8;
    state.orbs.push({ x: Math.random() * (width - r * 2) + r, y: -r, r, speed: 2 });
  }

  function update(dt) {
    // Move star field for parallax effect
    state.stars.forEach(star => {
      star.y += 0.5; // slow drift downwards
      if (star.y > height) {
        star.x = Math.random() * width;
        star.y = 0;
        star.size = Math.random() * 2 + 0.5;
        star.alpha = Math.random() * 0.5 + 0.5;
      }
    });
    const p = state.player;
    // Horizontal movement
    if (state.keys['ArrowLeft'] || state.keys['a']) p.vx = -4;
    else if (state.keys['ArrowRight'] || state.keys['d']) p.vx = 4;
    else p.vx = 0;
    // Thrust (upward) – consumes fuel
    if ((state.keys['ArrowUp'] || state.keys['w']) && p.fuel > 0) {
      p.vy = -5;
      p.fuel = Math.max(0, p.fuel - 0.2);
      // Play thrust sound
      playTone(400, 0.05);
    } else {
      p.vy = 2; // constant drift forward (downwards on screen)
    }
    // Apply movement
    p.x = Math.max(0, Math.min(width - p.w, p.x + p.vx));
    p.y += p.vy;
    // Keep player within vertical bounds
    if (p.y > height - p.h) p.y = height - p.h;
    // Fuel drain over time
    p.fuel = Math.max(0, p.fuel - 0.01);
    // Spawn obstacles/orbs periodically
    const now = performance.now();
    if (now - state.lastAsteroid > 1500) {
      spawnAsteroid();
      state.lastAsteroid = now;
    }
    if (now - state.lastOrb > 3000) {
      spawnOrb();
      state.lastOrb = now;
    }
    // Update asteroids
    state.asteroids.forEach((a) => (a.y += a.speed));
    state.asteroids = state.asteroids.filter((a) => a.y - a.r < height);
    // Update orbs
    state.orbs.forEach((o) => (o.y += o.speed));
    state.orbs = state.orbs.filter((o) => o.y - o.r < height);
    // Collision detection
    for (const a of state.asteroids) {
        if (rectCircleCollide(p, a)) {
          state.running = false;
          // Play collision sound
          playTone(80, 0.3);
          break;
        }
    }
    for (let i = state.orbs.length - 1; i >= 0; i--) {
      const o = state.orbs[i];
        if (rectCircleCollide(p, o)) {
          p.fuel = Math.min(100, p.fuel + 20);
          // Play orb collection sound
          playTone(600, 0.1);
          state.orbs.splice(i, 1);
        }
    }
    // Lose when fuel runs out
    if (p.fuel <= 0) state.running = false;
  }

  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - (rect.x + rect.w / 2));
    const distY = Math.abs(circle.y - (rect.y + rect.h / 2));
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function draw() {
    // Clear with vertical gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001020'); // deep space top
    bgGrad.addColorStop(1, '#000011'); // dark bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Star field background with parallax stars
    state.stars.forEach(star => {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    // Background planet silhouette
    ctx.fillStyle = 'rgba(100,120,255,0.15)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, 80, 0, Math.PI * 2);
    ctx.fill();

    // Ship (triangle) with gradient
    const p = state.player;
    const shipGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    shipGrad.addColorStop(0, '#00ffcc');
    shipGrad.addColorStop(1, '#0066aa');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, p.y);
    ctx.lineTo(p.x, p.y + p.h);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when accelerating
    if ((state.keys['ArrowUp'] || state.keys['w']) && p.fuel > 0) {
      const flameGrad = ctx.createRadialGradient(p.x + p.w / 2, p.y + p.h, 0, p.x + p.w / 2, p.y + p.h, p.w);
      flameGrad.addColorStop(0, 'rgba(255,150,0,0.8)');
      flameGrad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(p.x + p.w / 2, p.y + p.h);
      ctx.lineTo(p.x + p.w / 2 - p.w / 4, p.y + p.h + p.h / 2);
      ctx.lineTo(p.x + p.w / 2 + p.w / 4, p.y + p.h + p.h / 2);
      ctx.closePath();
      ctx.fill();
    }
    // Asteroids with radial gradient
    for (const a of state.asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaaaaa');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Orbs with glowing effect
    ctx.globalCompositeOperation = 'lighter';
    for (const o of state.orbs) {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2);
      grad.addColorStop(0, 'rgba(255,220,0,0.8)');
      grad.addColorStop(1, 'rgba(255,150,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // Fuel gauge
    const gaugeWidth = 100;
    const gaugeHeight = 10;
    ctx.fillStyle = '#555555';
    ctx.fillRect(10, 10, gaugeWidth, gaugeHeight);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, 10, (p.fuel / 100) * gaugeWidth, gaugeHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(10, 10, gaugeWidth, gaugeHeight);
    // Game over text
    if (!state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (state.running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
