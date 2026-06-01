// game.js – Simple Space Miner implementation targeting the canvas with id "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Resume audio on user interaction (required by browsers)
  const resumeAudio = () => { audioCtx.resume(); };
  canvas.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustOsc.osc.stop(audioCtx.currentTime + 0.1);
    thrustOsc = null;
  }
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollisionSound() {
    playTone(300, 0.1);
  }
  function playGameOverSound() {
    playTone(80, 0.5);
  }

  // ----- Game state -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    radius: 12,
    speedX: 0,
    speedY: 0,
    thrust: 0.1,
    rotSpeed: 0.07,
    health: 100,
    fuel: 100,
  };

  const asteroids = [];
  const keys = {};
  const maxAsteroids = 30;
  let lastSpawn = 0;
  const spawnInterval = 2000; // ms

  // ----- Input handling -----
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helpers -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // generate starfield
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  function spawnAsteroid() {
    const edge = Math.floor(rand(0, 4)); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const speed = rand(0.5, 2);
    const dir = rand(0, Math.PI * 2);
    vx = Math.cos(dir) * speed;
    vy = Math.sin(dir) * speed;
    switch (edge) {
      case 0:
        x = rand(0, canvas.width);
        y = -20;
        break;
      case 1:
        x = canvas.width + 20;
        y = rand(0, canvas.height);
        break;
      case 2:
        x = rand(0, canvas.width);
        y = canvas.height + 20;
        break;
      case 3:
        x = -20;
        y = rand(0, canvas.height);
        break;
    }
    asteroids.push({ x, y, vx, vy, r: rand(15, 30) });
  }

  function update(dt) {
    // Controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotSpeed;
    const thrusting = keys['ArrowUp'] && ship.fuel > 0;
    if (thrusting) {
      ship.speedX += Math.cos(ship.angle) * ship.thrust;
      ship.speedY += Math.sin(ship.angle) * ship.thrust;
      ship.fuel = Math.max(0, ship.fuel - 0.05);
    }
    // Thrust sound handling
    if (thrusting) startThrustSound(); else stopThrustSound();
    // Move ship
    ship.x += ship.speedX;
    ship.y += ship.speedY;
    // screen wrap
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Friction
    ship.speedX *= 0.99;
    ship.speedY *= 0.99;

    // Update asteroids
    for (let a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -30) a.x = canvas.width + 30;
      if (a.x > canvas.width + 30) a.x = -30;
      if (a.y < -30) a.y = canvas.height + 30;
      if (a.y > canvas.height + 30) a.y = -30;
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        // Simple damage and resource collection
        ship.health = Math.max(0, ship.health - 20);
        ship.fuel = Math.min(100, ship.fuel + 10);
        asteroids.splice(i, 1);
        // Play collision sound
        playCollisionSound();
      }
    }
    // Thrust sound handling
    if (thrusting) startThrustSound(); else stopThrustSound();

    // Move ship
    ship.x += ship.speedX;
    ship.y += ship.speedY;
    // screen wrap
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Friction
    ship.speedX *= 0.99;
    ship.speedY *= 0.99;

    // Update asteroids
    for (let a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -30) a.x = canvas.width + 30;
      if (a.x > canvas.width + 30) a.x = -30;
      if (a.y < -30) a.y = canvas.height + 30;
      if (a.y > canvas.height + 30) a.y = -30;
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        // Simple damage and resource collection
        ship.health = Math.max(0, ship.health - 20);
        ship.fuel = Math.min(100, ship.fuel + 10);
        asteroids.splice(i, 1);
      }
    }

    // Spawn asteroids over time
    const now = Date.now();
    if (now - lastSpawn > spawnInterval && asteroids.length < maxAsteroids) {
      spawnAsteroid();
      lastSpawn = now;
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw starfield
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship as gradient triangle
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-ship.radius, 0, ship.radius, 0);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0033ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids with radial gradient
    for (let a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaaaaa');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI – health & fuel
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Health: ${Math.round(ship.health)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 40);

    // Thruster flame when accelerating
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      const flameGrad = ctx.createLinearGradient(0, 0, -ship.radius * 2, 0);
      flameGrad.addColorStop(0, 'rgba(255,200,0,0.8)');
      flameGrad.addColorStop(1, 'rgba(255,50,0,0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-ship.radius, -ship.radius / 2);
      ctx.lineTo(-ship.radius * 2, 0);
      ctx.lineTo(-ship.radius, ship.radius / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  let lastTime = performance.now();
  let gameOver = false;
  function loop(time) {
    const dt = time - lastTime;
    lastTime = time;
    if (ship.health > 0 && ship.fuel > 0) {
      if (gameOver) gameOver = false; // reset if revived (unlikely)
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      if (!gameOver) {
        playGameOverSound();
        gameOver = true;
      }
      // Game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f55';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  // Start the game
  requestAnimationFrame(loop);
})();
