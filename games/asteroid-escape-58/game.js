// Asteroid Escape game implementation
// Assumes a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Game objects
  const ship = {
    x: 80,
    y: height / 2,
    radius: 12,
    vy: 0,
    thrust: -0.4,
    color: '#0ff'
  };

  const asteroids = [];
  const stars = [];
  let frame = 0;
  let score = 0;
  let running = true;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, time) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + time);
  };

  // Input handling
  const onInput = (e) => {
    ship.vy = ship.thrust;
    playBeep(300, 0.1); // thrust sound
  };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') onInput(e); });
  window.addEventListener('mousedown', onInput);
  window.addEventListener('touchstart', onInput);

  function spawnAsteroid() {
    const gap = 80;
    const topHeight = Math.random() * (height - gap - 40) + 20;
    const bottomY = topHeight + gap;
    const speed = 2 + Math.random() * 2;
    asteroids.push({x: width, w: 30, top: topHeight, bottom: bottomY, speed});
  }

  function spawnStar() {
    const y = Math.random() * height;
    const speed = 2 + Math.random() * 2;
    stars.push({x: width, y, radius: 4, speed, collected: false});
  }

  function update() {
    // Ship physics
    ship.vy += 0.02; // gravity
    ship.y += ship.vy;

    // Bounds check (lose condition)
    if (ship.y - ship.radius < 0 || ship.y + ship.radius > height) running = false;

    // Asteroid movement
    asteroids.forEach(a => a.x -= a.speed);
    // Remove off‑screen asteroids
    while (asteroids.length && asteroids[0].x + asteroids[0].w < 0) asteroids.shift();

    // Star movement
    stars.forEach(s => s.x -= s.speed);
    while (stars.length && stars[0].x + stars[0].radius < 0) stars.shift();

    // Collision detection
    for (const a of asteroids) {
      if (ship.x + ship.radius > a.x && ship.x - ship.radius < a.x + a.w) {
        if (ship.y - ship.radius < a.top || ship.y + ship.radius > a.bottom) {
          running = false;
          playBeep(150, 0.3); // crash sound
        }
      }
    }
    // Star collection
    for (const s of stars) {
      if (!s.collected && Math.hypot(ship.x - s.x, ship.y - s.y) < ship.radius + s.radius) {
        s.collected = true;
        score += 10;
        playBeep(600, 0.05); // collection sound
      }
    }

    // Spawn new obstacles / stars periodically
    if (frame % 120 === 0) spawnAsteroid();
    if (frame % 180 === 0) spawnStar();
    frame++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw ship as a sleek triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x - ship.radius, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius * 1.5, ship.y);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with rounded edges
    ctx.fillStyle = '#555';
    for (const a of asteroids) {
      // top chunk
      ctx.beginPath();
      ctx.moveTo(a.x, 0);
      ctx.lineTo(a.x + a.w, 0);
      ctx.lineTo(a.x + a.w, a.top);
      ctx.lineTo(a.x, a.top);
      ctx.closePath();
      ctx.fill();
      // bottom chunk
      ctx.beginPath();
      ctx.moveTo(a.x, a.bottom);
      ctx.lineTo(a.x + a.w, a.bottom);
      ctx.lineTo(a.x + a.w, height);
      ctx.lineTo(a.x, height);
      ctx.closePath();
      ctx.fill();
    }

    // Draw twinkling stars with varying alpha
    for (const s of stars) {
      if (!s.collected) {
        const alpha = 0.5 + 0.5 * Math.sin(frame * 0.1 + s.x * 0.01);
        ctx.fillStyle = `rgba(255,255,0,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start game
  loop();
})();
