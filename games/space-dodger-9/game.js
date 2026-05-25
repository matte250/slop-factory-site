// Simple spaceship‑asteroid dodge game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas missing
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('click', resumeAudio, { once: true });
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000);
  };

  // starfield for depth – generate once
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
    });
  }

  // spaceship – triangle shape
  const ship = { w: 40, h: 20, x: width / 2, y: height - 30, speed: 5, dx: 0 };

  // asteroids – include rotation state
  const asteroids = [];
  const spawnFreq = 1000; // ms
  let lastSpawn = 0;
  let lastTime = 0;
  let gameOver = false;

  // controls – arrow keys or mouse move
  const setDirection = (dir) => { ship.dx = dir * ship.speed; };
  window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { setDirection(-1); playBeep(200, 50); } else if (e.key === 'ArrowRight') { setDirection(1); playBeep(200, 50); } });
  window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setDirection(0); });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    // keep inside bounds
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));
  });

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (width - 2 * radius) + radius;
    const speed = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // radians per ms
    asteroids.push({ x, y: -radius, r: radius, s: speed, a: angle, rs: rotSpeed });
    // sound for asteroid spawn
    playBeep(300, 80);
  }

  function update(dt) {
    // ship movement
    ship.x += ship.dx;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.s * dt * 0.06; // scale speed
      // apply rotation
      if (a.rs) a.a = (a.a || 0) + a.rs * dt;
      // collision with ship (simple AABB vs circle)
      const distX = Math.abs(a.x - ship.x);
      const distY = Math.abs(a.y - (ship.y + ship.h / 2));
      if (distX <= (ship.w / 2 + a.r) && distY <= (ship.h / 2 + a.r)) {
        gameOver = true;
      }
      // remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // spawn new asteroids
    if (performance.now() - lastSpawn > spawnFreq) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // static starfield
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // ship – stylized triangle with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y + ship.h / 2);
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    const shipGrad = ctx.createLinearGradient(-ship.w / 2, -ship.h / 2, ship.w / 2, ship.h / 2);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00f');
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.restore();
    // asteroids with rotation and radial gradient
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.a || 0);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
