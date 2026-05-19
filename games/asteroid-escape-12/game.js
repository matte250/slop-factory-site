// Simple Asteroid Escape game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.07,
  };
  const shipTrail = [];
  const maxTrail = 20;

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  const asteroidMinSpeed = 0.5;
  const asteroidMaxSpeed = 2.0;
  const asteroidMinRadius = 15;
  const asteroidMaxRadius = 30;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4); // 0: top,1:right,2:bottom,3:left
    let x, y, vx, vy;
    const radius = Math.random() * (asteroidMaxRadius - asteroidMinRadius) + asteroidMinRadius;
    const speed = Math.random() * (asteroidMaxSpeed - asteroidMinSpeed) + asteroidMinSpeed;
    const angle = Math.random() * Math.PI * 2;
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -radius;
    } else if (edge === 1) { // right
      x = width + radius;
      y = Math.random() * height;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + radius;
    } else { // left
      x = -radius;
      y = Math.random() * height;
    }
    // velocity towards canvas centre with some variation
    const dir = Math.atan2(height / 2 - y, width / 2 - x) + (Math.random() - 0.5) * 0.5;
    vx = Math.cos(dir) * speed;
    vy = Math.sin(dir) * speed;
    asteroids.push({ x, y, vx, vy, radius });
    // spawn sound
    playTone(220, 0.03);
  }

  let lastSpawn = 0;
  let gameOver = false;

  function update(dt) {
    // ship controls
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // thrust sound
      playTone(440, 0.05);
    }
    // apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // wrap ship around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // record ship trail
    shipTrail.push({ x: ship.x, y: ship.y });
    if (shipTrail.length > maxTrail) shipTrail.shift();

    // asteroids movement
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.radius) a.x += width + a.radius * 2;
      if (a.x > width + a.radius) a.x -= width + a.radius * 2;
      if (a.y < -a.radius) a.y += height + a.radius * 2;
      if (a.y > height + a.radius) a.y -= height + a.radius * 2;
    }

    // collision detection (ship tip point)
    const shipTipX = ship.x + Math.cos(ship.angle) * ship.radius;
    const shipTipY = ship.y + Math.sin(ship.angle) * ship.radius;
    for (const a of asteroids) {
      const dx = shipTipX - a.x;
      const dy = shipTipY - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius) {
        // collision sound
        playTone(110, 0.4);
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // draw star field background
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship trail (simple fade)
    if (!gameOver && shipTrail && shipTrail.length) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shipTrail[0].x, shipTrail[0].y);
      for (let i = 1; i < shipTrail.length; i++) {
        ctx.lineTo(shipTrail[i].x, shipTrail[i].y);
      }
      ctx.stroke();
    }
    // draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius * 0.6, ship.radius * 0.6);
    ctx.lineTo(-ship.radius * 0.6, -ship.radius * 0.6);
    ctx.closePath();
    ctx.fillStyle = '#00ffcc';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    // draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      if (now - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastSpawn = now;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
