// Simple asteroid escape game
// Assumes an HTML <canvas id="game"></canvas> exists.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playBeep(freq, duration) {
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

  // Generate background stars
  const starCount = Math.floor((width * height) / 8000);
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
    });
  }




  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroid pool
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames between spawns

  // Game state
  let score = 0;
  let running = true;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size * 2) + size;
    const y = -size;
    const speed = Math.random() * 1.5 + 0.5;
    asteroids.push({ x, y, radius: size, speed, color: '#888' });
  }

  function updateShip() {
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y + ship.dy));
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }
    if (asteroidTimer-- <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidInterval;
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // Play collision sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playBeep(200, 0.2);
        running = false;
        break;
      }
    }
  }

  function drawShip() {
    // Draw ship as a simple triangle pointing upwards
    const size = ship.radius * 2;
    const gradient = ctx.createLinearGradient(ship.x, ship.y - ship.radius, ship.x, ship.y + ship.radius);
    gradient.addColorStop(0, '#66f');
    gradient.addColorStop(1, '#004');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius); // tip
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
  }

  let frame = 0;

function drawBackground() {
  // Space gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawStars() {
  for (const s of stars) {
    const alpha = 0.5 + 0.5 * Math.sin(frame * 0.05 + s.twinkle);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop() {
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
    ctx.fillText(`Final Score: ${Math.floor(score)}`, width / 2, height / 2 + 30);
    return;
  }
  // Clear and draw background
  ctx.clearRect(0, 0, width, height);
  drawBackground();
  drawStars();
  updateShip();
  updateAsteroids();
  checkCollision();
  drawShip();
  drawAsteroids();
  drawScore();
  score += 0.05; // increase over time
  frame++;
  requestAnimationFrame(loop);
}

  // Start the game loop
  requestAnimationFrame(loop);
})();
