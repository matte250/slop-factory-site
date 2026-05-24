// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playCollisionSound() {
    // Low pitch beep for collision
    playBeep(150, 0.3);
  }
  function playThrustSound() {
    // Short higher pitch beep for thrust
    playBeep(400, 0.05);
  }

  // Ship definition
  const ship = {
    x: 80,
    y: height / 2,
    radius: 15,
    speedX: 2, // constant forward speed
    speedY: 0,
    maxYSpeed: 4,
    color: 'cyan',
  };

  // Input handling
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  let score = 0;
  let running = true;
  let lastTime = performance.now();

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20; // 20-50px
    const yPos = Math.random() * (height - size) + size / 2;
    asteroids.push({
      x: width + size,
      y: yPos,
      radius: size / 2,
      speed: 2 + Math.random() * 3, // 2-5 px/frame
      color: 'gray',
    });
  }

  function update(dt) {
    // Ship vertical control
    let thrusting = false;
    if (keys.ArrowUp) { ship.speedY = -ship.maxYSpeed; thrusting = true; }
    else if (keys.ArrowDown) { ship.speedY = ship.maxYSpeed; thrusting = true; }
    else ship.speedY = 0;
    if (thrusting) playThrustSound();
    if (keys.ArrowLeft) ship.x -= ship.speedX; // slight lateral movement
    if (keys.ArrowRight) ship.x += ship.speedX;
    // keep within bounds
    ship.y += ship.speedY;
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));

    // Move asteroids leftwards
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }

    // Collision detection (circle vs circle)
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        running = false;
        playCollisionSound();
        break;
      }
    }

    // Score based on time survived
    score += dt * 0.01; // increase slowly
  }

function draw() {
  // Background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  // Stars
  if (!window._stars) {
    window._stars = [];
    for (let i = 0; i < 100; i++) {
      window._stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
    }
  }
  ctx.fillStyle = 'white';
  for (const s of window._stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ship - draw as triangle with gradient
  const shipGradient = ctx.createLinearGradient(ship.x - ship.radius, ship.y, ship.x + ship.radius, ship.y);
  shipGradient.addColorStop(0, 'cyan');
  shipGradient.addColorStop(1, 'blue');
  ctx.fillStyle = shipGradient;
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.radius, ship.y);
  ctx.lineTo(ship.x - ship.radius, ship.y - ship.radius);
  ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
  ctx.closePath();
  ctx.fill();

  // Asteroids - radial gradient for depth
  for (const a of asteroids) {
    const gradient = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
    gradient.addColorStop(0, 'lightgray');
    gradient.addColorStop(1, 'gray');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Score
  ctx.fillStyle = 'white';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);

  // Game over overlay
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.font = '40px sans-serif';
    ctx.fillText('Game Over', width / 2 - 100, height / 2);
  }
}

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      if (timestamp - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    if (running) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
