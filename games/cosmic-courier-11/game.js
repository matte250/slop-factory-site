// Simple infinite‑scroll asteroid game
// Canvas element with id="game" must exist in the page.
// Arrow keys move the ship, asteroids reduce health, fuel cans refill fuel.
// Health and fuel are displayed as bars at the top.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context starts on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playBeep(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Game state
  // Create a starfield background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const ship = {
    x: width / 2,
    y: height - 60,
    size: 20,
    speed: 4,
    health: 100,
    fuel: 100,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const asteroids = [];
  const fuels = [];
  const SPAWN_RATE_ASTEROID = 90; // frames
  const SPAWN_RATE_FUEL = 300;
  let frame = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const x = Math.random() * (width - 2 * radius) + radius;
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function spawnFuel() {
    const size = 12;
    const x = Math.random() * (width - size);
    const speed = 2;
    fuels.push({ x, y: -size, size, speed });
  }

  function update() {
    // Move stars to create scrolling background
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    // Move ship based on input
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y));

    // Fuel drains over time
    ship.fuel = Math.max(0, ship.fuel - 0.02);
    if (ship.fuel === 0) ship.health = Math.max(0, ship.health - 0.05);

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship (simple circle‑rect check)
      const dx = Math.abs(ship.x - a.x);
      const dy = Math.abs(ship.y - a.y);
      if (dx < ship.size && dy < ship.size + a.radius) {
          ship.health = Math.max(0, ship.health - 20);
          // Play collision sound
          playBeep(150, 0.15);
          asteroids.splice(i, 1);
          continue;
      }
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      // Collision with ship (rect‑rect)
        if (
          ship.x > f.x &&
          ship.x < f.x + f.size &&
          ship.y > f.y &&
          ship.y < f.y + f.size
        ) {
          ship.fuel = Math.min(100, ship.fuel + 30);
          // Play fuel collection sound
          playBeep(400, 0.08);
          fuels.splice(i, 1);
          continue;
        }
      if (f.y > height) fuels.splice(i, 1);
    }

    if (ship.health <= 0) {
      // Play game over sound
      playBeep(80, 0.5, 'sawtooth');
      gameOver = true;
    }
  }

  function drawBar(x, y, w, h, pct, color) {
    ctx.fillStyle = '#555';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * pct, h);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x, y, w, h);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    // Draw starfield background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship (triangle pointing up)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw fuel cans
    ctx.fillStyle = '#f80';
    fuels.forEach(f => {
      ctx.fillRect(f.x, f.y, f.size, f.size);
    });

    // Draw meters
    drawBar(10, 10, 150, 15, ship.health / 100, '#f00'); // health
    drawBar(10, 30, 150, 15, ship.fuel / 100, '#ff0'); // fuel

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      if (frame % SPAWN_RATE_ASTEROID === 0) spawnAsteroid();
      if (frame % SPAWN_RATE_FUEL === 0) spawnFuel();
      update();
    }
    render();
    frame++;
    requestAnimationFrame(loop);
  }

  loop();
})();
