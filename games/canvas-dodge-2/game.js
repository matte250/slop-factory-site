// Canvas Dodge Game
// Assumes a <canvas id="game"></canvas> element exists.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
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
  function playThrust() {
    // short high-pitch thrust sound
    playTone(300, 0.05);
  }
  function playExplosion() {
    // descending tone for explosion
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  // Ensure audio context is resumed on first user interaction
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Background stars
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  // Thrust particles
  const particles = [];

  // Ship
const ship = {
  // shape: triangle
  direction: 0, // radians, 0 points up
  x: width / 2,
  y: height / 2,
  size: 15,
  speed: 3,
  dx: 0,
  dy: 0,
};

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidSize = 20;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  let score = 0;
  let gameOver = false;
  let startTime = performance.now();

  function spawnAsteroid() {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    const centerX = width / 2, centerY = height / 2;
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -asteroidSize;
    } else if (edge === 1) { // right
      x = width + asteroidSize;
      y = Math.random() * height;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + asteroidSize;
    } else { // left
      x = -asteroidSize;
      y = Math.random() * height;
    }
    // Direction towards center
    const dx = centerX - x;
    const dy = centerY - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    // Generate irregular polygon vertices
    const vertexCount = 6 + Math.floor(Math.random() * 3); // 6-8 vertices
    const radius = (asteroidSize + Math.random() * 10) / 2;
    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (Math.PI * 2 / vertexCount) * i;
      const offset = Math.random() * 0.4 + 0.8; // 0.8-1.2 scale
      vertices.push({ x: Math.cos(angle) * radius * offset, y: Math.sin(angle) * radius * offset });
    }
    asteroids.push({ x, y, vx, vy, size: radius * 2, angle: 0, angularVelocity: (Math.random() - 0.5) * 0.1, vertices });
  }

  function update(dt) {
    // Ship movement
    ship.dx = ship.dy = 0;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));
    // Update ship direction to face movement (0 radians = up)
    if (ship.dx !== 0 || ship.dy !== 0) {
      ship.direction = Math.atan2(ship.dx, -ship.dy);
      // Emit thrust particles opposite to movement
      const angle = ship.direction + Math.PI; // opposite
      const speed = 0.5 + Math.random() * 0.5;
      particles.push({
        x: ship.x,
        y: ship.y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 30,
        size: Math.random() * 2 + 1,
      });
      playThrust();
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 1;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.angularVelocity; // rotate asteroid
      // Remove if out of bounds
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
      if (dist < a.size / 2 + ship.size) {
        playExplosion();
        gameOver = true;
      }
    }

    // Score based on survival time
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Clear with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Background stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Thrust particles
    ctx.fillStyle = 'orange';
    for (const p of particles) {
      ctx.globalAlpha = Math.max(p.life / 30, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    // Ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.direction);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size * 0.6, ship.size);
    ctx.lineTo(-ship.size * 0.6, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids (rotating irregular polygons)
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      if (a.vertices && a.vertices.length) {
        const v0 = a.vertices[0];
        ctx.moveTo(v0.x, v0.y);
        for (let i = 1; i < a.vertices.length; i++) {
          const v = a.vertices[i];
          ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();
      } else {
        const r = a.size / 2;
        ctx.moveTo(r * Math.cos(0), r * Math.sin(0));
        for (let i = 1; i < 6; i++) {
          const theta = (Math.PI * 2 / 6) * i;
          ctx.lineTo(r * Math.cos(theta), r * Math.sin(theta));
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }
    // Score
    ctx.fillStyle = 'yellow';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
