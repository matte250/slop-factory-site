// Simple Space Runner game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: 100, y: height / 2, radius: 15, dy: 0 };
  const asteroids = [];
  const fuels = [];
  let fuel = 100; // percent
  let speed = 2; // scroll speed
  let gameOver = false;

  // Input handling
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.1, 'triangle'); }
  function playCollect() { playTone(600, 0.08, 'sine'); }
  function playExplosion() { playTone(100, 0.5, 'sawtooth'); }
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') { ship.dy = -3; playThrust(); }
    if (e.code === 'ArrowDown') { ship.dy = 3; playThrust(); }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') ship.dy = 0;
  });
  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width + size, y: Math.random() * height, radius: size, speed: speed + 1 });
  }
  function spawnFuel() {
    const size = 10;
    fuels.push({ x: width + size, y: Math.random() * height, radius: size, speed: speed });
  }

  // Main loop
  function update() {
    if (gameOver) return;
    // Move ship
    ship.y += ship.dy;
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // Decrease fuel
    fuel -= 0.05;
    if (fuel <= 0) endGame();

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
      // Collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.radius + ship.radius) endGame();
    }

    // Move fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      if (f.x + f.radius < 0) fuels.splice(i, 1);
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
        if (Math.hypot(dx, dy) < f.radius + ship.radius) {
          fuel = Math.min(100, fuel + 20);
          fuels.splice(i, 1);
          playCollect();
        }

    }

    // Random spawns
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    draw();
    requestAnimationFrame(update);
  }

  // Draw everything with a simple space theme
function draw() {
    // Background: dark space with stars
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, width, height);
    // Stars (static background)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Ship – draw as a triangle with a thrust flame when moving
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.radius, ship.y);
    ctx.lineTo(ship.x - ship.radius, ship.y - ship.radius / 2);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    if (ship.dy !== 0) {
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(ship.x - ship.radius, ship.y);
      ctx.lineTo(ship.x - ship.radius - 10, ship.y - 5);
      ctx.lineTo(ship.x - ship.radius - 10, ship.y + 5);
      ctx.closePath();
      ctx.fill();
    }
    // Asteroids – use radial gradient for a 3‑D look
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#999');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel cells – glowing yellow circles
    fuels.forEach(f => {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,0,0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Fuel bar – semi‑transparent background with a green fill
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 10, 200, 10);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, fuel * 2, 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 200, 10);
  }

  function endGame() {
    // Play explosion sound once
    playExplosion();
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  // Start loop
  update();
})();
