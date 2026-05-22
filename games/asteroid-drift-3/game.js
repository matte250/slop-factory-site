// Asteroid Drift – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  // --- Sound Engine ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrustSound = 0;

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // Ship state
  const ship = {
    x: W / 2,
    y: H / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 12,
  };

  // Input handling
  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', (e) => {
    if (!audioStarted) {
      // resume AudioContext on first user interaction
      audioCtx.resume();
      audioStarted = true;
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Game objects
  const asteroids = [];
  const stars = [];
  let score = 0;
  let gameOver = false;
  let frames = 0;

  const rand = (min, max) => Math.random() * (max - min) + min;

  function spawnAsteroid() {
    const size = rand(15, 40);
    // Generate a simple irregular polygon for visual variety
    const vertices = [];
    const sides = Math.floor(rand(5, 9)); // 5‑8 sides
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const radius = size * rand(0.7, 1.0);
      vertices.push({angle, radius});
    }
    asteroids.push({
      x: rand(0, W),
      y: -size,
      vx: rand(-0.5, 0.5),
      vy: rand(0.5, 2),
      r: size,
      angle: rand(0, Math.PI * 2), // current rotation
      rotSpeed: rand(-0.02, 0.02), // rotation per frame
      vertices,
    });
  }

  function spawnStar() {
    const size = 4;
    stars.push({
      x: rand(0, W),
      y: -size,
      vy: rand(0.8, 1.5),
      r: size,
    });
  }

  function update() {
    if (gameOver) return;
    frames++;
    // Ship controls
    if (keys.ArrowLeft) ship.angle -= 0.05;
    if (keys.ArrowRight) ship.angle += 0.05;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * 0.1;
      ship.vy += Math.sin(ship.angle) * 0.1;
      // play thrust sound (limit rate)
      const now = performance.now();
      if (now - lastThrustSound > 80) {
        playTone(250, 0.04, 'sawtooth');
        lastThrustSound = now;
      }
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Move ship
    ship.x = (ship.x + ship.vx + W) % W;
    ship.y = (ship.y + ship.vy + H) % H;

    // Spawn objects
    if (frames % 120 === 0) spawnAsteroid(); // every 2 sec @ 60fps
    if (frames % 180 === 0) spawnStar();

    // Update asteroids – move and rotate
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // rotate asteroid
      if (a.rotSpeed) a.angle += a.rotSpeed;
      // remove off‑screen
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.vy;
      if (s.y - s.r > H) stars.splice(i, 1);
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
        if (dist < a.r + ship.radius) {
          // crash sound
          playTone(120, 0.4, 'sawtooth');
          gameOver = true;
          break;
        }
    }
    // Collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = s.x - ship.x;
      const dy = s.y - ship.y;
      if (Math.hypot(dx, dy) < s.r + ship.radius) {
        score++;
        stars.splice(i, 1);
      }
    }
  }

  function draw() {
    // background gradient (dark space -> subtle nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars – luminous glows
    for (const s of stars) {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
      grad.addColorStop(0, 'rgba(255,255,200,0.8)');
      grad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // asteroids - draw as rotating polygons
    ctx.strokeStyle = '#aaa';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      // use generated vertices if present
      if (a.vertices && a.vertices.length) {
        const first = a.vertices[0];
        ctx.moveTo(first.radius * Math.cos(first.angle), first.radius * Math.sin(first.angle));
        for (let i = 1; i < a.vertices.length; i++) {
          const v = a.vertices[i];
          ctx.lineTo(v.radius * Math.cos(v.angle), v.radius * Math.sin(v.angle));
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.restore();
    }
    // ship (triangle) with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // glow effect using shadow
    ctx.shadowColor = 'rgba(0,255,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
