// Simple Asteroid Escape game
// Canvas element with id="game" must exist in the page.
// Controls: Arrow keys to steer the ship.
// Collect fuel cells to extend timer; colliding with an asteroid or timer=0 ends the game.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Game state
  // Starfield background
  const stars = Array.from({ length: 100 }, () => ({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1 }));
  const ship = { x: width / 2, y: height - 60, w: 30, h: 30, speed: 3 };
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  let asteroids = [];
  let fuels = [];
  let timer = 30; // seconds
  let lastTime = performance.now();
  let spawnAsteroidCooldown = 0;
  let spawnFuelCooldown = 0;
  let gameOver = false;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Input handling
  window.addEventListener('keydown', e => { audioCtx.resume(); if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.02; // small rotation
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 1 + Math.random() * 2, angle, angularSpeed });
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 1 + Math.random() * 2 });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({ x: Math.random() * (width - size), y: -size, r: size / 2, speed: 1.5 });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectIntersect(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > (rect.w / 2 + circle.r)) return false;
    if (distY > (rect.h / 2 + circle.r)) return false;
    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
  }

  function update(dt) {
    if (gameOver) return;

    // Timer countdown
    timer -= dt / 1000;
    if (timer <= 0) { timer = 0; playTone(150, 0.5); gameOver = true; }

    // Ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn asteroids
    spawnAsteroidCooldown -= dt;
    if (spawnAsteroidCooldown <= 0) { spawnAsteroid(); spawnAsteroidCooldown = 800; }
    // Spawn fuel cells
    spawnFuelCooldown -= dt;
    if (spawnFuelCooldown <= 0) { spawnFuel(); spawnFuelCooldown = 5000; }

    // Update asteroids
    // Update stars (move down, wrap)
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    asteroids.forEach(a => {
      a.y += a.speed;
      if (a.angle !== undefined) {
        a.angle += a.angularSpeed;
      }
    });
    asteroids = asteroids.filter(a => a.y < height);
    // Update fuels
    fuels.forEach(f => f.y += f.speed);
    fuels = fuels.filter(f => f.y < height);

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (rectIntersect(ship, asteroids[i])) { gameOver = true; break; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const fuel = fuels[i];
      if (circleRectIntersect({ x: fuel.x + fuel.r, y: fuel.y + fuel.r, r: fuel.r }, ship)) {
        timer = Math.min(60, timer + 5); // add 5 seconds, cap at 60
        fuels.splice(i, 1);
        playTone(400, 0.2);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0c0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Stars (twinkling)
    ctx.fillStyle = '#bbb';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Asteroids (gray with rotation)
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.angle || 0);
      ctx.translate(-a.w / 2, -a.h / 2);
      ctx.fillRect(0, 0, a.w, a.h);
      ctx.restore();
    });

    // Fuel cells (yellow circles)
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x + f.r, f.y + f.r, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Timer UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Time: ' + Math.ceil(timer), 10, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
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
