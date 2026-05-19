// Simple Orbit Defense game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  const center = { x: width / 2, y: height / 2 };

  // Turret state
  let angle = 0; // radians
  const turretRadius = 20;
  const turretLength = 30;

  // Projectiles
  const bullets = [];
  const bulletSpeed = 5;
  const bulletRadius = 3;

  // Asteroids
  const asteroids = [];
  const asteroidMinSpeed = 0.5;
  const asteroidMaxSpeed = 2;
  const asteroidSpawnInterval = 1500; // ms
  // Stars for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, alpha: 0.5 + Math.random() * 0.5 });
  }
  // Particles for explosions
  const particles = [];

  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Audio setup
  let audioCtx;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playShoot() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playExplosion() {
    initAudio();
    const bufferSize = audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    noise.connect(filter).connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.3);
  }

  function spawnAsteroid() {
    // Random edge position
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * height; }
    else if (side === 1) { x = width; y = Math.random() * height; }
    else if (side === 2) { x = Math.random() * width; y = 0; }
    else { x = Math.random() * width; y = height; }
    const dx = center.x - x;
    const dy = center.y - y;
    const dist = Math.hypot(dx, dy);
    const speed = asteroidMinSpeed + Math.random() * (asteroidMaxSpeed - asteroidMinSpeed);
    asteroids.push({ x, y, vx: (dx / dist) * speed, vy: (dy / dist) * speed, r: 15 });
  }

  function update(dt) {
    if (gameOver) return;
    // Turret rotation
    if (keys.ArrowLeft) angle -= 0.05;
    if (keys.ArrowRight) angle += 0.05;
    // Shoot
    if (keys[' '] && bullets.length < 10) { // simple fire rate limit
      playShoot();
      bullets.push({ x: center.x, y: center.y, vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed, age: 0 });
    }
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy; b.age += dt;
      if (b.x < 0 || b.x > width || b.y < 0 || b.y > height || b.age > 2000) bullets.splice(i, 1);
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // Collision with turret (center)
      if (Math.hypot(a.x - center.x, a.y - center.y) < turretRadius + a.r) { gameOver = true; }
    }
    // Bullet-asteroid collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + bulletRadius) {
          // Remove bullet and asteroid
          bullets.splice(i, 1);
          asteroids.splice(j, 1);
          score++;
          // Play explosion sound
          playExplosion();
          // Create explosion particles
          for (let p = 0; p < 8; p++) {
            const angleP = Math.random() * Math.PI * 2;
            const speedP = Math.random() * 2 + 1;
            particles.push({
              x: a.x,
              y: a.y,
              vx: Math.cos(angleP) * speedP,
              vy: Math.sin(angleP) * speedP,
              life: 30,
              maxLife: 30,
              size: 2 + Math.random() * 2,
              color: '#ff8'
            });
          }
          break;
        }
      }
    }
    // Spawn new asteroids over time
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#001');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Star field
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    // Draw turret with glow
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.shadowColor = 'rgba(255,0,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#c00';
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f44';
    ctx.fillRect(0, -5, turretLength, 10);
    ctx.restore();
    // Draw bullets with slight trail
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, bulletRadius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw particles (explosions)
    particles.forEach((p, idx) => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      // update
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) particles.splice(idx, 1);
    });
    ctx.globalAlpha = 1;
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
