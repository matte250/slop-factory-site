// Simple Asteroid Dodge game with enhanced graphics
// Canvas with id="game" expected in HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  const ship = { x: width / 2, y: height - 60, w: 30, h: 30, speed: 5 };
  const stars = [];
  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  const keys = {};
  const asteroids = [];
  let score = 0;
  let lastTime = 0;
  let spawnTimer = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // Simple move sound for directional keys
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)) {
      playTone(300, 50);
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -size, w: size, h: size, speed });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // Keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Starfield movement (parallax)
    stars.forEach(s => {
      s.y += s.speed * dt * 0.06; // adjust speed factor
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    // Asteroid logic
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = 800 + Math.random() * 1200; // ms
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) { asteroids.splice(i, 1); score++; }
      // Collision
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x &&
          a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        // Game over – restart
        playTone(120, 200);
        alert('Game Over! Score: ' + score);
        // Reset state
        asteroids.length = 0;
        ship.x = width / 2; ship.y = height - 60; score = 0; spawnTimer = 0;
        break;
      }
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    stars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // Ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00f');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Asteroids (radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2, a.y + a.h / 2, a.w * 0.1,
        a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
