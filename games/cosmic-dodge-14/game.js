// Simple "Cosmic Dodge" game targeting <canvas id="game">
// Ship: thrust & rotate, asteroids spawn & move, 3 hits = game over, score = survival time

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Full‑screen canvas
  canvas.width = canvas.clientWidth || window.innerWidth;
  canvas.height = canvas.clientHeight || window.innerHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };

  const asteroids = [];
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let speedFactor = 1;
  const keys = {};
  let hits = 0;
  const maxHits = 3;
  let startTime = performance.now();
  let gameOver = false;

  // Input handling (resume audio on interaction)
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    // Spawn just outside a random edge
    if (edge === 0) { x = -radius; y = Math.random() * canvas.height; }
    else if (edge === 1) { x = canvas.width + radius; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = -radius; }
    else { x = Math.random() * canvas.width; y = canvas.height + radius; }
    const angle = Math.atan2(canvas.height/2 - y, canvas.width/2 - x);
    const speed = (0.5 + Math.random()) * speedFactor;
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius });
  }

  function update(dt) {
    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= 0.005 * dt;
    if (keys['ArrowRight']) ship.angle += 0.005 * dt;
    // Thrust
    if (keys['ArrowUp']) {
      const thrust = 0.001 * dt;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      // Play thrust sound (short burst)
      playTone(400, 50);
    }
    // Apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Wrap
      if (a.x < -a.radius) a.x = canvas.width + a.radius;
      if (a.x > canvas.width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = canvas.height + a.radius;
      if (a.y > canvas.height + a.radius) a.y = -a.radius;
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        hits++;
        // Play collision sound
        playTone(200, 150);
        // Remove asteroid to avoid repeated hits
        a.x = -9999; a.y = -9999;
        if (hits >= maxHits) { gameOver = true; }
        // Play game over sound when threshold reached
        if (hits >= maxHits) { playTone(100, 500); }
      }
    }

    // Spawn new asteroids
    const now = performance.now();
    if (now - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
      // increase difficulty
      spawnInterval = Math.max(500, spawnInterval - 50);
      speedFactor += 0.02;
    }
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ship with simple thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body gradient
    const shipGrad = ctx.createLinearGradient(-10, -10, 10, 10);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#080');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when accelerating
    if (keys['ArrowUp']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Stars (twinkling)
    ctx.fillStyle = '#555';
    for (const s of stars) {
      // Slight random pulsate for twinkle effect
      const pulse = (Math.random() - 0.5) * 0.3;
      const r = Math.max(0.5, s.radius + pulse);
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    ctx.fillText(`Hits: ${hits}/${maxHits}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(prev) {
    const now = performance.now();
    const dt = now - prev;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(() => loop(now));
  }

  requestAnimationFrame(() => loop(performance.now()));
})();
