// Simple Orbital Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const centre = { x: canvas.width / 2, y: canvas.height / 2 };
  const planet = { x: centre.x, y: centre.y, r: 30 };

  // Background stars (generated once)
  const stars = [];
  const starCount = Math.floor((canvas.width * canvas.height) / 8000);
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
  }

  // Ship state
  const ship = { angle: 0, radius: 80, r: 8 };

  // Controls
  const keys = {};
  // Resume audio context on first user interaction
  let audioResumed = false;
  function ensureAudio() {
    if (!audioResumed) {
      audioCtx.resume();
      audioResumed = true;
    }
  }
  addEventListener('keydown', e => {
    ensureAudio();
    keys[e.key] = true;
  });
  addEventListener('keyup', e => {
    keys[e.key] = false;
    // Stop engine sound if no movement keys pressed
    if (!keys.ArrowLeft && !keys.ArrowRight && !keys.ArrowUp && !keys.ArrowDown) {
      stopEngineSound();
    }
  });

  // Asteroids
  const asteroids = [];
  const asteroidSpeed = 1.5;
  const spawnInterval = 1000; // ms

  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let engineOsc = null;
  function startEngineSound() {
    if (engineOsc) return;
    engineOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    engineOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    engineOsc.connect(gain).connect(audioCtx.destination);
    engineOsc.start();
  }
  function stopEngineSound() {
    if (!engineOsc) return;
    engineOsc.stop();
    engineOsc.disconnect();
    engineOsc = null;
  }
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function spawnAsteroid() {
    // Choose random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * canvas.height; }
    else if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = 0; }
    else { x = Math.random() * canvas.width; y = canvas.height; }
    // Direction toward centre
    const dx = centre.x - x;
    const dy = centre.y - y;
    const len = Math.hypot(dx, dy);
    const vx = (dx / len) * asteroidSpeed;
    const vy = (dy / len) * asteroidSpeed;
    asteroids.push({ x, y, vx, vy, r: 12 });
  }

  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  function update(dt) {
    // Controls
    if (keys.ArrowLeft) ship.angle -= 0.07;
    if (keys.ArrowRight) ship.angle += 0.07;
    if (keys.ArrowUp) ship.radius = Math.max(40, ship.radius - 2);
    if (keys.ArrowDown) ship.radius = Math.min(Math.min(canvas.width, canvas.height) / 2 - 40, ship.radius + 2);

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove if out of bounds (safety)
      if (a.x < -50 || a.x > canvas.width + 50 || a.y < -50 || a.y > canvas.height + 50) {
        asteroids.splice(i, 1);
      }
    }

    // Compute ship position
    const shipX = centre.x + ship.radius * Math.cos(ship.angle);
    const shipY = centre.y + ship.radius * Math.sin(ship.angle);

    // Collisions
    for (const a of asteroids) {
      const d = Math.hypot(a.x - shipX, a.y - shipY);
      if (d < a.r + ship.r) {
        gameOver = true;
        playBeep(400, 0.2); // collision beep
        break;
      }
    }
    // Ship vs planet
    if (Math.hypot(shipX - planet.x, shipY - planet.y) < ship.r + planet.r) {
      gameOver = true;
      playBeep(300, 0.3); // planet collision beep
    }

    // Start engine sound if moving
    if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) {
      startEngineSound();
    }

    // Stop engine on game over
    if (gameOver) {
      stopEngineSound();
    }
    // Render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Stars background
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Planet with gradient
  const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
  planetGrad.addColorStop(0, '#88c');
  planetGrad.addColorStop(1, '#224');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
  ctx.fill();
  // Ship as triangle pointing forward
  const shipX = centre.x + ship.radius * Math.cos(ship.angle);
  const shipY = centre.y + ship.radius * Math.sin(ship.angle);
  const shipDir = ship.angle;
  const shipSize = ship.r * 2;
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.moveTo(
    shipX + Math.cos(shipDir) * shipSize,
    shipY + Math.sin(shipDir) * shipSize
  );
  ctx.lineTo(
    shipX + Math.cos(shipDir + Math.PI * 0.75) * ship.r,
    shipY + Math.sin(shipDir + Math.PI * 0.75) * ship.r
  );
  ctx.lineTo(
    shipX + Math.cos(shipDir - Math.PI * 0.75) * ship.r,
    shipY + Math.sin(shipDir - Math.PI * 0.75) * ship.r
  );
  ctx.closePath();
  ctx.fill();
  // Asteroids as irregular polygons
  ctx.fillStyle = '#a52a2a';
  for (const a of asteroids) {
    ctx.beginPath();
    const points = 6;
    for (let i = 0; i < points; i++) {
      const theta = (Math.PI * 2 / points) * i;
      const rad = a.r + Math.random() * 3 - 1.5;
      const x = a.x + Math.cos(theta) * rad;
      const y = a.y + Math.sin(theta) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  // Score / Time
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
  ctx.fillText(`Time: ${elapsed}s`, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }

  }

  function loop(ts) {
    if (!gameOver) {
      const dt = ts - (lastTime || ts);
      lastTime = ts;
      update(dt);
      requestAnimationFrame(loop);
    } else {
      // Stop loop, leave final frame displayed
    }
  }
  let lastTime;
  requestAnimationFrame(loop);
})();
