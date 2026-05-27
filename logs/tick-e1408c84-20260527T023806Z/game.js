// Space Dodger Game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 400;
  const h = canvas.height = canvas.clientHeight || 600;
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // initialize stars
  initStars();
  // Player ship
  const ship = { x: w / 2, y: h - 40, w: 30, h: 30, speed: 4 };

  // Asteroids array
  const asteroids = [];
  const asteroidSize = 30;
  const spawnInterval = 1000; // ms
  // starfield
  const stars = [];
  const starCount = 100;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        alpha: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }
  function updateStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > h) {
        s.y = 0;
        s.x = Math.random() * w;
        s.alpha = Math.random() * 0.5 + 0.5;
        s.speed = Math.random() * 0.5 + 0.2;
      }
    }
  }
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const x = Math.random() * (w - asteroidSize);
    asteroids.push({ x, y: -asteroidSize, w: asteroidSize, h: asteroidSize, speed: 2 + Math.random() * 2 });
  }

  function update(dt) {
    // ship movement (arrow keys or WASD)
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x));

    // update stars
    updateStars();

    // asteroids move down (relative to ship moving up)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off-screen
        if (a.y > h) {
        asteroids.splice(i, 1);
        score++;
        playBeep(200, 0.05);
      } else if (rectCollide(ship, a)) {
        gameOver = true;
        playBeep(800, 0.3);
        break;
      }
    }
    // spawn new asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function rectCollide(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function draw() {
    // background starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;
    // ship as triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2, a.y + a.h / 2, a.w / 4,
        a.x + a.w / 2, a.y + a.h / 2, a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, a.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', w / 2 - 60, h / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
