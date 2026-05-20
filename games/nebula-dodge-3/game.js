// Simple “Nebula Dodge” arcade game
// Canvas element expected: <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // -----------------------------------------------------------------
  // Setup
  // -----------------------------------------------------------------
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  };
  resize();
  addEventListener('resize', resize);

  // create starfield background
  const stars = [];
  const starCount = 200;
  const initStars = () => {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
  };
  initStars();

  const drawStars = () => {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.opacity;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  // -----------------------------------------------------------------
  // Player
  // -----------------------------------------------------------------
  const ship = {
    w: 40,
    h: 30,
    x: innerWidth / 2 - 20,
    y: innerHeight - 60,
    speed: 6,
    dx: 0,
  };

  // -----------------------------------------------------------------
  // Nebula clouds
  // -----------------------------------------------------------------
  const nebulae = [];
  const nebulaSpawnRate = 800; // ms
  const nebulaSpeed = 2;

  const spawnNebula = () => {
    const w = 80 + Math.random() * 120;
    const h = 40 + Math.random() * 80;
    const x = Math.random() * (canvas.width - w);
    nebulae.push({ x, y: -h, w, h });
  };
  const nebulaTimer = setInterval(spawnNebula, nebulaSpawnRate);

  // -----------------------------------------------------------------
  // Input
  // -----------------------------------------------------------------
  const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
  addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
  });
  addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  // audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  // short beep for movement
  const playBeep = (freq, duration) => playTone(freq, duration);
  // background hum
  const bgInterval = setInterval(() => playTone(110, 0.2), 3000);


  const updateShip = () => {
    ship.dx = 0;
    let moved = false;
    if (keys.ArrowLeft || keys.a) { ship.dx = -ship.speed; moved = true; }
    if (keys.ArrowRight || keys.d) { ship.dx = ship.speed; moved = true; }
    if (moved) playBeep(400, 0.07);
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x + ship.dx));
  };

  // -----------------------------------------------------------------
  // Collision
  // -----------------------------------------------------------------
  const collides = (a, b) =>
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.h + b.y;

  // -----------------------------------------------------------------
  // Game loop
  // -----------------------------------------------------------------
  let startTime = performance.now();
  let gameOver = false;

  const drawShip = () => {
    // ship with gradient and glow
    const grad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#007');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  };

  const drawNebulae = () => {
    nebulae.forEach(n => {
      const grad = ctx.createRadialGradient(
        n.x + n.w / 2,
        n.y + n.h / 2,
        n.w * 0.1,
        n.x + n.w / 2,
        n.y + n.h / 2,
        Math.max(n.w, n.h) / 2
      );
      grad.addColorStop(0, 'rgba(200,50,150,0.6)');
      grad.addColorStop(1, 'rgba(100,10,80,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(n.x + n.w / 2, n.y + n.h / 2, n.w / 2, n.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawScore = () => {
    const secs = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${secs}s`, 10, 30);
  };

  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    const final = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`Score: ${final}s`, canvas.width / 2, canvas.height / 2 + 30);
  };

  const loop = () => {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background stars
    drawStars();

    // Update objects
    updateShip();
    // move stars for parallax
    stars.forEach(s => {
      s.y += 0.3;
      if (s.y > canvas.height) s.y = 0;
    });
    nebulae.forEach(n => (n.y += nebulaSpeed));
    // Remove off‑screen nebulae
    while (nebulae.length && nebulae[0].y > canvas.height) nebulae.shift();

    // Collision test
    if (nebulae.some(n => collides(ship, n))) {
      gameOver = true;
      clearInterval(nebulaTimer);
      clearInterval(bgInterval);
      // play collision sound
      playTone(120, 0.4);
      drawGameOver();
      return;
    }

    // Render
    drawShip();
    drawNebulae();
    drawScore();

    requestAnimationFrame(loop);
  };

  // -----------------------------------------------------------------
  // Start
  // -----------------------------------------------------------------
  loop();
})();
