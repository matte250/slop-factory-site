// Asteroid Collector – minimal implementation
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // --- Helpers ---------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // --- Sound utilities ---------------------------------------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.05, 'triangle'); }
  function playCollect() { playTone(800, 0.07, 'square'); }
  function playExplosion() { playTone(100, 0.3, 'sawtooth'); }
  function playGameOver() { playTone(50, 0.5, 'sine'); }

  // --- Ship -----------------------------------------------------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.2,
    friction: 0.99,
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // --- Stars ----------------------------------------------------
  const stars = [];
  function spawnStar() {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      radius: 3,
      ttl: 120, // frames
    });
  }
  // spawn a star every 60 frames
  let starTimer = 0;

  // --- Asteroids ------------------------------------------------
  const asteroids = [];
  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4));
    const pos = [
      { x: -20, y: rand(0, height) },
      { x: width + 20, y: rand(0, height) },
      { x: rand(0, width), y: -20 },
      { x: rand(0, width), y: height + 20 },
    ][side];
    const speed = rand(1, 3);
    const angle = Math.atan2(height / 2 - pos.y, width / 2 - pos.x);
    asteroids.push({
      x: pos.x,
      y: pos.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: rand(12, 20),
    });
  }
  let asteroidTimer = 0;

  // --- Game State -----------------------------------------------
  let score = 0;
  let gameOver = false;

  // --- Main Loop ------------------------------------------------
  function update() {
    if (gameOver) return;

    // Controls
    if (keys.ArrowLeft) ship.angle -= 0.07;
    if (keys.ArrowRight) ship.angle += 0.07;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // ensure audio context is running
      if (audioCtx.state !== 'running') audioCtx.resume();
      playThrust();
    }

    // Apply friction & move ship
    ship.vx *= ship.friction;
    ship.vy *= ship.friction;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Keep ship within bounds (wrap)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Stars handling
    if (starTimer++ > 60) { spawnStar(); starTimer = 0; }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.ttl--;
      if (s.ttl <= 0) stars.splice(i, 1);
      else if (dist(ship, s) < ship.radius + s.radius) {
        score++;
        stars.splice(i, 1);
        playCollect();
      }
    }

    // Asteroids handling
    if (asteroidTimer++ > 180) { spawnAsteroid(); asteroidTimer = 0; }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // wrap asteroids
      if (a.x < -30) a.x = width + 30;
      if (a.x > width + 30) a.x = -30;
      if (a.y < -30) a.y = height + 30;
      if (a.y > height + 30) a.y = -30;
      if (dist(ship, a) < ship.radius + a.radius) {
        // collision with asteroid
        gameOver = true;
        if (audioCtx.state !== 'running') audioCtx.resume();
        playExplosion();
        // slight delay before final game‑over tone
        setTimeout(playGameOver, 200);
      }
    }

    draw();
    if (!gameOver) requestAnimationFrame(update);
    else {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      ctx.fillText('Score: ' + score, width / 2 - 70, height / 2 + 40);
    }
  }

  function draw() {
    // Background – deep space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001020');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ship – white hull with thin cyan outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Stars – bright with glow
    ctx.fillStyle = 'yellow';
    ctx.shadowColor = 'rgba(255,255,150,0.8)';
    ctx.shadowBlur = 6;
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset

    // Asteroids – gray rocks with subtle shading
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(100,100,100,0.5)';
    ctx.shadowBlur = 4;
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0; // reset

    // Score – cyan text for visibility
    ctx.fillStyle = '#00ffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  // start
  update();
})();
