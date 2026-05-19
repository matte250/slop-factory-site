// Simple Space Dodger game
// Assumes a <canvas id="game"></canvas> exists in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const playShoot = () => playTone(800, 0.05);
  const playExplosion = () => playTone(200, 0.3);

  // Player ship
  const ship = {
    x: 50,
    y: H / 2,
    w: 40,
    h: 20,
    speed: 4,
    color: '#0f0',
    bullets: [],
  };

  // Asteroid pool
  let asteroids = [];
  const asteroidFreq = 90; // frames
  let frame = 0;
  // Stars background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: W,
      y: Math.random() * (H - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
    });
  }

  function update() {
    // Player movement
    if (keys['ArrowUp']) ship.y = Math.max(0, ship.y - ship.speed);
    if (keys['ArrowDown']) ship.y = Math.min(H - ship.h, ship.y + ship.speed);
    if (keys['Space']) {
      // fire bullet (rate limited by simple time check)
      if (!ship._lastShot || Date.now() - ship._lastShot > 200) {
        ship.bullets.push({ x: ship.x + ship.w, y: ship.y + ship.h / 2 - 2, w: 8, h: 4, speed: 6 });
        ship._lastShot = Date.now();
        playShoot();
      }
    }

    // Update bullets
    ship.bullets.forEach(b => (b.x += b.speed));
    ship.bullets = ship.bullets.filter(b => b.x < W);

    // Update asteroids
    asteroids.forEach(a => (a.x -= a.speed));
    // Remove off‑screen asteroids
    asteroids = asteroids.filter(a => a.x + a.w > 0);

    // Spawn new asteroids
    if (frame % asteroidFreq === 0) spawnAsteroid();

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // ship vs asteroid
if (rectCollision(ship, a)) {
          playExplosion();
          alert('Game Over');
          document.location.reload();
          return;
        }
      // bullet vs asteroid
      for (let j = ship.bullets.length - 1; j >= 0; j--) {
        const b = ship.bullets[j];
        if (rectCollision(b, a)) {
          ship.bullets.splice(j, 1);
          asteroids.splice(i, 1);
          break;
        }
      }
    }

    frame++;
  }

function draw() {
    // Background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = 'white';
    ctx.beginPath();
    stars.forEach(s => ctx.moveTo(s.x, s.y) && ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2));
    ctx.fill();
    // Ship (triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Bullets (small circles)
    ctx.fillStyle = '#ff0';
    ship.bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Asteroids (circles with gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.2,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
