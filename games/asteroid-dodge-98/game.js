// Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.1, now);
    osc.start(now);
    osc.stop(now + duration);
  }
  // star field for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }

  // Ship configuration
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Input handling
  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid configuration
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 1000; // ms
  let lastTime = 0;
  let gameOver = false;
  let speedIncrease = 0.02; // per second

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x, y: -radius, r: radius, speed });
    // subtle beep for new asteroid
    playBeep(150, 0.05);
  }

  function update(dt) {
    // Move ship with sound feedback
    let moved = false;
    if (keys.ArrowLeft || keys.a) { ship.x -= ship.speed; moved = true; }
    if (keys.ArrowRight || keys.d) { ship.x += ship.speed; moved = true; }
    if (moved) playBeep(200, 0.03);
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnAsteroid();
      spawnTimer = 0;
      // gradually increase difficulty
      spawnInterval = Math.max(200, spawnInterval - dt * speedIncrease);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision detection (simple AABB vs circle)
      if (
        a.y + a.r >= ship.y &&
        a.x + a.r > ship.x &&
        a.x - a.r < ship.x + ship.w
      ) {
        gameOver = true;
        playBeep(400, 0.2);
      }
      // remove off‑screen asteroids
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }
  }

  function draw() {
    // background with stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars (tiny white points)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // Ship as a triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
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
