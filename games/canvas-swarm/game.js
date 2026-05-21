// Simple canvas game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});
  window.addEventListener('mousedown', resumeAudio, {once: true});

  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const playCollectSound = () => beep(800, 0.1);
  const playCrashSound = () => beep(200, 0.3);

  // Ship definition with triangle shape
  const ship = {
    x: width / 2,
    y: height - 50,
    radius: 12,
    speed: 4,
    color: '#0ff',
    dx: 0,
    dy: 0,
  };
  // background stars for parallax (small, twinkling)
  const bgStars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2 + 0.5,
    alpha: Math.random(),
    speed: Math.random() * 0.3 + 0.2,
  }));

  // Input handling (arrow keys / WASD)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid and star pools
  const asteroids = [];
  const stars = [];
  let score = 0;
  let gameOver = false;

  // Utility functions
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnAsteroid() {
    const size = rand(15, 40);
    asteroids.push({
      x: rand(0, width),
      y: -size,
      radius: size,
      speed: rand(1, 3),
      color: '#a33',
    });
  }

  function spawnStar() {
    stars.push({
      x: rand(0, width),
      y: -10,
      radius: 5,
      speed: rand(1, 2),
      color: '#ff0',
    });
  }

  // Main loop
  let frame = 0;
  function update() {
    if (gameOver) return;
    // Move ship based on keys
    ship.dx = ship.dy = 0;
    if (keys.ArrowLeft || keys.a) ship.dx = -ship.speed;
    if (keys.ArrowRight || keys.d) ship.dx = ship.speed;
    if (keys.ArrowUp || keys.w) ship.dy = -ship.speed;
    if (keys.ArrowDown || keys.s) ship.dy = ship.speed;
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y + ship.dy));

    // Spawn periodically
    if (frame % 60 === 0) spawnAsteroid(); // roughly 1 per second
    if (frame % 120 === 0) spawnStar();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship
        if (distance(a, ship) < a.radius + ship.radius) {
          gameOver = true;
          playCrashSound();
        }
      // remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Update background stars (parallax)
    bgStars.forEach(st => {
      st.y += st.speed || 0.5; // small constant speed
      if (st.y > height) {
        st.x = Math.random() * width;
        st.y = -st.radius;
        st.alpha = Math.random();
      }
    });

    // Update stars (collectibles)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
        if (distance(s, ship) < s.radius + ship.radius) {
          score += 10;
          playCollectSound();
          stars.splice(i, 1);
          continue;
        }
      if (s.y - s.radius > height) stars.splice(i, 1);
    }

    frame++;
    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Space gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Parallax background stars (twinkling)
    bgStars.forEach(st => {
      ctx.globalAlpha = st.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Ship (triangle) with subtle gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.radius, ship.x, ship.y + ship.radius);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#06c');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial shading
    asteroids.forEach(a => {
      const rg = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      rg.addColorStop(0, '#f44');
      rg.addColorStop(1, '#800');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Stars (collectibles) with glow effect
    stars.forEach(s => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.color;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // Start loop
  requestAnimationFrame(update);
})();
