// Meteor Dodge game with improved graphics and sound
// Assumes a <canvas id="game"></canvas> exists in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', dur = 0.1, volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Create a simple starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship definition (triangle shape)
  const ship = {
    w: 60,
    h: 20,
    x: width / 2 - 30,
    y: height - 30,
    speed: 6,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left - ship.w / 2;
    clampShip();
  });

  function clampShip() {
    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.w > width) ship.x = width - ship.w;
  }

  // Meteor pool
  const meteors = [];
  let spawnTimer = 0;
  let speedMultiplier = 1;
  let running = true;

  function spawnMeteor() {
    const size = 20 + Math.random() * 30;
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size / 2,
      speed: 2 + Math.random() * 2,
    });
    // Play a short tone when a meteor appears
    playSound(300, 'sine', 0.05);
  }

  function update(dt) {
    // Ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    clampShip();

    // Meteors
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnMeteor();
      spawnTimer = 1000 / (speedMultiplier * 0.7);
      speedMultiplier += 0.02; // gradually increase difficulty
    }
    meteors.forEach(m => {
      m.y += m.speed * speedMultiplier;
    });
    // Remove off‑screen meteors
    while (meteors.length && meteors[0].y - meteors[0].r > height) meteors.shift();

    // Collision detection
    for (const m of meteors) {
      if (
        m.x + m.r > ship.x &&
        m.x - m.r < ship.x + ship.w &&
        m.y + m.r > ship.y &&
        m.y - m.r < ship.y + ship.h
      ) {
        // Collision – play impact sound and stop the game
        playSound(120, 'square', 0.2, 0.4);
        running = false;
        break;
      }
    }
  }

  function draw() {
    // Space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000822');
    bgGrad.addColorStop(1, '#001133');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship – draw as a triangle
    ctx.fillStyle = '#0a84ff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(
        m.x + m.r,
        m.y + m.r,
        m.r * 0.2,
        m.x + m.r,
        m.y + m.r,
        m.r
      );
      grad.addColorStop(0, '#ffcc00');
      grad.addColorStop(1, '#ff3b30');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.r, m.y + m.r, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(ts) {
    const dt = ts - last;
    last = ts;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
