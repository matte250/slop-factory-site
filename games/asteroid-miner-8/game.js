// Simple asteroid miner game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }
  // Particles for collision effects
  const particles = [];
  // Simple sound system
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  function playCollision() { beep(200, 0.1); }
  function playCollect() { beep(600, 0.05); }
  function playGameOver() { beep(100, 0.5); }

  // Drone
  const drone = {
    x: width / 2,
    y: height / 2,
    r: 12,
    speed: 2,
    vx: 0,
    vy: 0,
    integrity: 100,
    // appearance gradient created each frame
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Entities
  const asteroids = [];
  const ores = [];
  const maxAsteroids = 5;
  const maxOres = 7;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() {
    const side = Math.floor(random(0, 4)); // 0:top 1:right 2:bottom 3:left
    let x, y, vx, vy;
    const size = random(15, 30);
    const speed = random(0.5, 1.5);
    if (side === 0) { // top
      x = random(0, width);
      y = -size;
      vx = random(-0.5, 0.5);
      vy = speed;
    } else if (side === 1) { // right
      x = width + size;
      y = random(0, height);
      vx = -speed;
      vy = random(-0.5, 0.5);
    } else if (side === 2) { // bottom
      x = random(0, width);
      y = height + size;
      vx = random(-0.5, 0.5);
      vy = -speed;
    } else { // left
      x = -size;
      y = random(0, height);
      vx = speed;
      vy = random(-0.5, 0.5);
    }
    asteroids.push({ x, y, r: size, vx, vy });
  }

  function spawnOre() {
    const x = random(20, width - 20);
    const y = random(20, height - 20);
    const r = 8;
    ores.push({ x, y, r, collected: false });
  }

  // Initial spawn
  for (let i = 0; i < maxAsteroids; i++) spawnAsteroid();
  for (let i = 0; i < maxOres; i++) spawnOre();

  function update() {
    // Drone movement
    drone.vx = 0;
    drone.vy = 0;
    if (keys['ArrowLeft']) drone.vx = -drone.speed;
    if (keys['ArrowRight']) drone.vx = drone.speed;
    if (keys['ArrowUp']) drone.vy = -drone.speed;
    if (keys['ArrowDown']) drone.vy = drone.speed;
    drone.x += drone.vx;
    drone.y += drone.vy;

    // Keep drone on canvas (lose if leaves)
    if (drone.x < 0 || drone.x > width || drone.y < 0 || drone.y > height) {
      drone.integrity = 0; // trigger game over
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove if off-screen and respawn
      if (a.x < -a.r || a.x > width + a.r || a.y < -a.r || a.y > height + a.r) {
        asteroids.splice(i, 1);
        spawnAsteroid();
      }
    }

    // Collision: drone vs asteroids
    for (const a of asteroids) {
      const dx = drone.x - a.x;
      const dy = drone.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < drone.r + a.r) {
        drone.integrity -= 20;
        // push drone away slightly
        drone.x += dx / dist * 5;
        drone.y += dy / dist * 5;
        // create spark particles
        for (let i = 0; i < 6; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 1 + 0.5;
          particles.push({
            x: drone.x,
            y: drone.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
          });
        }
        playCollision();
      }
    }

    // Collision: drone vs ores
    for (const o of ores) {
      if (o.collected) continue;
      const dx = drone.x - o.x;
      const dy = drone.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < drone.r + o.r) {
        o.collected = true;
      }
    }

    // Respawn collected ores
    for (let i = ores.length - 1; i >= 0; i--) {
      if (ores[i].collected) {
        ores.splice(i, 1);
        spawnOre();
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Particles (collision sparks)
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,165,0,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Drone with gradient
    const grad = ctx.createRadialGradient(drone.x, drone.y, drone.r * 0.2, drone.x, drone.y, drone.r);
    grad.addColorStop(0, drone.integrity > 0 ? '#0f0' : '#f00');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(drone.x, drone.y, drone.r, 0, Math.PI * 2);
    ctx.fill();
    // Asteroids with shading
    for (const a of asteroids) {
      const ag = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      ag.addColorStop(0, '#777');
      ag.addColorStop(1, '#222');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ores glowing
    for (const o of ores) {
      const og = ctx.createRadialGradient(o.x, o.y, o.r * 0.2, o.x, o.y, o.r);
      og.addColorStop(0, '#ff0');
      og.addColorStop(1, '#880');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Integrity: ${drone.integrity}`, 10, 15);
  }

  function loop() {
    if (drone.integrity <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
