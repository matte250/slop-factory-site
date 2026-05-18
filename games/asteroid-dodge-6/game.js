// Simple Asteroid Dodge game
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // --- Game state -------------------------------------------------
  const ship = { x: canvas.width / 2, y: canvas.height - 50, angle: 0, radius: 15 };
  const keys = {};
  const asteroids = [];
  let lastAsteroid = 0;
  let score = 0;
  let fuel = 100; // percent
  let gameOver = false;
  // --- Audio -------------------------------------------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let lastThrustTime = 0;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() {
    const now = performance.now();
    if (now - lastThrustTime < 100) return; // throttle
    lastThrustTime = now;
    playTone(400, 80);
  }
  function playExplosion() {
    // white noise burst
    const bufferSize = audioCtx.sampleRate * 0.3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.3);
  }

  // --- Input -------------------------------------------------------
  window.addEventListener('keydown', e => {
    // resume audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // --- Helpers -----------------------------------------------------
  function rand(min, max) { return Math.random() * (max - min) + min; }
  // create a starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, canvas.width), y: rand(0, canvas.height), r: rand(0.5, 1.5) });
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body gradient
    const grad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    // thrust flame when accelerating
    if (keys.ArrowUp || keys.w) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius / 2, ship.radius + 10);
      ctx.lineTo(-ship.radius / 2, ship.radius + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  function drawAsteroid(a) {
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawAsteroid(a) {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fillStyle = '#888';
    ctx.fill();
  }
  function spawnAsteroid() {
    const r = rand(10, 30);
    asteroids.push({ x: rand(r, canvas.width - r), y: -r, r, speed: rand(1, 3) + (score / 10000) });
  }
  function updateShip(dt) {
    const thrust = 0.2;
    if (keys.ArrowUp || keys.w) {
      ship.x += Math.sin(ship.angle) * thrust * dt;
      ship.y -= Math.cos(ship.angle) * thrust * dt;
      playThrust();
    }
    if (keys.ArrowLeft || keys.a) ship.angle -= 0.004 * dt;
    if (keys.ArrowRight || keys.d) ship.angle += 0.004 * dt;
    // keep inside bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));
  }
  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt * 0.05; // speed scaling
      if (a.y - a.r > canvas.height) {
        asteroids.splice(i, 1);
        score += 10;
      }
    }
  }
  function checkCollisions() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        gameOver = true;
        playExplosion();
        break;
      }
    }
  }
  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
  }

  // --- Main loop ---------------------------------------------------
  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
      return; // stop animation
    }
    // clear with space background
    ctx.fillStyle = '#000022';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw starfield
    drawStars();

    // spawn asteroids every ~800ms
    if (now - lastAsteroid > 800) {
      spawnAsteroid();
      lastAsteroid = now;
    }

    updateShip(dt);
    updateAsteroids(dt);
    checkCollisions();
    fuel -= dt * 0.01; // fuel consumption
    if (fuel <= 0) gameOver = true;

    // draw everything
    drawShip();
    asteroids.forEach(drawAsteroid);
    drawHUD();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
