// Space Runner game with enhanced graphics
// Targets canvas with id "game" in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Enhanced game state
  const player = { x: width / 2, y: height - 60, w: 30, h: 30, speed: 4 };
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  let orbs = [];
  let asteroids = [];
  const stars = [];
  let particles = [];
  let score = 0;
  let timer = 30; // seconds
  let lastTime = performance.now();
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollectSound = () => playTone(800, 0.07, 'triangle');
  const playExplosionSound = () => playTone(150, 0.3, 'sawtooth');

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCircleCollide = (rx, ry, rw, rh, cx, cy, cr) => {
    // Find closest point to circle within rectangle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  };

  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), r: rand(0.5, 1.5) });
  }

  // Input handling
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Spawn functions
  const spawnOrb = () => {
    const r = 8;
    const x = rand(r, width - r);
    const y = rand(r, height / 2);
    orbs.push({ x, y, r });
  };
  const spawnAsteroid = () => {
    const r = rand(15, 30);
    const x = rand(r, width - r);
    const y = -r;
    const speed = rand(1, 3);
    asteroids.push({ x, y, r, speed });
  };

  // Init some objects
  for (let i = 0; i < 5; i++) spawnOrb();
  for (let i = 0; i < 3; i++) spawnAsteroid();

  // Particle helper
  const spawnParticle = (x, y, color) => {
    const speed = rand(1, 3);
    const angle = rand(0, Math.PI * 2);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(20, 40),
      color,
    });
  };

  const update = (delta) => {
    // Move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(width - player.w, player.x));
    player.y = Math.max(0, Math.min(height - player.h, player.y));

    // Move asteroids
    asteroids.forEach(a => a.y += a.speed);
    // Remove off‑screen asteroids and spawn new ones
    asteroids = asteroids.filter(a => a.y - a.r < height);
    while (asteroids.length < 4) spawnAsteroid();

    // Update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
    });
    particles = particles.filter(p => p.life > 0);

    // Check collisions with asteroids
    for (const a of asteroids) {
      if (rectCircleCollide(player.x, player.y, player.w, player.h, a.x, a.y, a.r)) {
        // Explosion particles
        for (let i = 0; i < 12; i++) spawnParticle(player.x + player.w/2, player.y + player.h/2, '#ff4444');
        gameOver = true;
        break;
      }
    }

    // Check collisions with orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (rectCircleCollide(player.x, player.y, player.w, player.h, o.x, o.y, o.r)) {
        score++;
        // Spark particles on collect
        for (let j = 0; j < 8; j++) spawnParticle(o.x, o.y, '#ffdd00');
        orbs.splice(i, 1);
        spawnOrb();
      }
    }

    // Update timer
    timer -= delta / 1000;
    if (timer <= 0) gameOver = true;
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (tiny white dots)
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Particles (additive blend for glow)
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    // Player (blue gradient triangle)
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    playerGrad.addColorStop(0, '#33aaff');
    playerGrad.addColorStop(1, '#0044ff');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    // Orbs (glowing yellow)
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      orbGrad.addColorStop(0, '#fff700');
      orbGrad.addColorStop(1, '#ff9900');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Asteroids (rough gray with shading)
    asteroids.forEach(a => {
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      // simple highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(a.x - a.r/3, a.y - a.r/3, a.r/2, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, timer).toFixed(1)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffdd00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 20);
    }
  };

  const loop = (now) => {
    const delta = now - lastTime;
    lastTime = now;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
