// Asteroid Dodge simple implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;

  // ship
  const ship = { x: W/2, y: H-60, w: 40, h: 40, speed: 5 };
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    // play movement sound on arrow press
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      beep(600, 0.05);
    }
  });
  document.addEventListener('keyup', e => keys[e.key] = false);

  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // unlock on first interaction
  document.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  function beep(freq, duration) {
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

  // star field initialization
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.2 + Math.random() * 0.3
    });
  }

  // asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1000; // ms
  let speedFactor = 1;
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (W - size);
    asteroids.push({ x, y: -size, w: size, h: size, v: 1.5 * speedFactor });
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // star field movement (looping)
    for (let s of stars) {
      s.y += s.speed * dt * 0.05;
      if (s.y > H) {
        s.y = -2;
        s.x = Math.random() * W;
        s.speed = 0.2 + Math.random() * 0.3;
      }
    }

    // asteroid spawn timing
    asteroidTimer += dt;
    if (asteroidTimer > asteroidInterval) {
      asteroidTimer = 0;
      spawnAsteroid();
    }
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.v * dt * 0.06; // speed scaling
      if (a.y > H) { asteroids.splice(i, 1); score++; beep(800,0.07); }
    }
    // increase difficulty
    if (score && score % 10 === 0) speedFactor = 1 + score / 100;
    // collision
    for (const a of asteroids) {
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        gameOver = true; beep(400,0.3); break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // star field
    ctx.fillStyle = 'white';
    for (let s of stars) {
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // ship as triangle
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', W / 2 - 100, H / 2);
    }
  }

  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
