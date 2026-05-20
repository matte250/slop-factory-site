// Gravity Gauntlet – improved graphics
// Assumes a <canvas id="game"></canvas> exists in the page.

(() => {
  // ----- audio helpers -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // particle trail for player
  const trail = [];
  const MAX_TRAIL = 20;
  function addTrail() {
    trail.push({ x: player.x, y: player.y, alpha: 1 });
    if (trail.length > MAX_TRAIL) trail.shift();
  }
  function drawTrail() {
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      ctx.fillStyle = `rgba(0,255,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, player.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      p.alpha *= 0.9; // fade out
    }
  }

  // ----- graphics helpers -----
  // Create a starfield background (initialized after canvas)
  const stars = [];
  const STAR_COUNT = 100;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
      });
    }
  }
  function drawBackground() {
    // gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  // initialize starfield
  initStars();

  // ----- player -----
  const player = {
    x: 50,
    y: H / 2,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    color: '#0f0',
  };
  const GRAVITY = 0.05;

  // ----- asteroids -----
  const asteroids = [];
  const asteroidFrequency = 1500; // ms
  const asteroidSpeed = 2;

  // ----- input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first interaction
    if (!audioInitialized) {
      audioCtx.resume();
      audioInitialized = true;
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    asteroids.push({
      x: W + radius,
      y: radius + Math.random() * (H - 2 * radius),
      radius,
      vx: -asteroidSpeed,
      color: '#f55',
    });
  }
  setInterval(spawnAsteroid, asteroidFrequency);

  // ----- core loop -----
  let status = null; // null|"win"|"lose"
  function update() {
    // add trail point before moving
    addTrail();
    // player physics
    if (keys.ArrowUp) {
      player.vy -= player.thrust;
      playTone(300, 0.05);
    }
    if (keys.ArrowDown) player.vy += player.thrust;
    if (keys.ArrowLeft) player.vx -= player.thrust;
    if (keys.ArrowRight) player.vx += player.thrust;
    player.vy += GRAVITY; // gravity pulls down
    player.x += player.vx;
    player.y += player.vy;

    // simple bounds (no wrap)
    if (player.y - player.radius > H) { status = 'lose'; playTone(150, 0.3); }
    if (player.x + player.radius >= W) status = 'win';

    // asteroids movement and collision
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.radius < 0) {
        asteroids.splice(i, 1);
        continue;
      }
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const distSq = dx * dx + dy * dy;
      const radSum = a.radius + player.radius;
      if (distSq < radSum * radSum) status = 'lose';
    }
  }

  function draw() {
    // background
    drawBackground();
    // trail (draw behind player)
    drawTrail();
    // player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // asteroids
    for (const a of asteroids) {
      // slightly larger inner glow
      ctx.fillStyle = '#a33';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // status text
    if (status) {
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(status.toUpperCase(), W / 2, H / 2);
    }
  }

  function loop() {
    if (!status) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // start
  loop();
})();
