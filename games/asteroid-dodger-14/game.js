// Asteroid Dodger – minimal canvas game
// Canvas with id="game" must exist in the hosting HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game objects -----
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaserSound() { playTone(660); }
  function playExplosionSound() { playTone(220); }
  function playGameOverSound() { playTone(110); }

  const ship = {
    x: 50,
    y: height / 2,
    w: 30, // width for collision box
    h: 20, // height for collision box
    speed: 4,
    color: '#0f0',
  };

  const asteroids = [];
  const lasers = [];
  const stars = [];
  // create starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.2,
    });
  }

  let score = 0;
  let lastAsteroid = 0;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ----- Helpers -----
  function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const y = Math.random() * (height - size);
    const speed = Math.random() * 2 + 2;
    asteroids.push({ x: width, y, w: size, h: size, speed, color: '#a52a2a' });
  }

  function fireLaser() {
    lasers.push({ x: ship.x + ship.w, y: ship.y + ship.h / 2 - 2, w: 10, h: 4, speed: 8, color: '#ff0' });
  }

  // ----- Main loop -----
  function update(delta) {
    if (gameOver) return;

    // Ship movement
    if (keys['ArrowUp']) ship.y = Math.max(0, ship.y - ship.speed);
    if (keys['ArrowDown']) ship.y = Math.min(height - ship.h, ship.y + ship.speed);
    if (keys['Space']) {
      // simple debounce – only fire when space is newly pressed
      if (!keys._spacePrev) fireLaser();
      keys._spacePrev = true;
    } else {
      keys._spacePrev = false;
    }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.speed;
      if (l.x > width) lasers.splice(i, 1);
    }

    // Update stars (parallax move left)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }

    // Spawn asteroids over time
    if (performance.now() - lastAsteroid > 800) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) {
        asteroids.splice(i, 1);
        score++;
        continue;
      }
      // Collision with ship
      if (rectOverlap(a, ship)) {
        gameOver = true;
      }
      // Collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        if (rectOverlap(a, lasers[j])) {
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          score++;
          break;
        }
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();

    // Lasers (glow)
    lasers.forEach(l => {
      const grad = ctx.createLinearGradient(l.x, 0, l.x + l.w, 0);
      grad.addColorStop(0, 'rgba(255,255,0,0)');
      grad.addColorStop(0.5, l.color);
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(l.x, l.y, l.w, l.h);
    });

    // Asteroids (radial gradient circles)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
