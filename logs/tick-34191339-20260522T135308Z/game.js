// Simple Meteor Dodger game targeting <canvas id="game"></canvas>
// Enhanced graphics: starfield background, ship as triangle, meteors with radial gradient.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Ensure canvas has explicit size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 4,
  };
  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let moveSoundPlaying = false;
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    setTimeout(() => {
      osc.stop();
    }, dur);
  }
  function playMove() {
    if (!moveSoundPlaying) {
      moveSoundPlaying = true;
      playBeep(200, 100);
      setTimeout(() => moveSoundPlaying = false, 100);
    }
  }
  function playExplosion() {
    playBeep(100, 300);
    playBeep(150, 200);
    playBeep(200, 100);
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) playMove();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const meteors = [];
  let meteorTimer = 0;
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    const size = Math.random() * 20 + 10;
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      r: size / 2,
      speed: Math.random() * 2 + 2,
    });
  }

  function update() {
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // starfield scroll
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.5; // slow downward drift
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // meteors
    meteorTimer++;
    if (meteorTimer > 30) { // spawn roughly every half‑second
      spawnMeteor();
      meteorTimer = 0;
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // remove off‑screen
      if (m.y - m.r > canvas.height) meteors.splice(i, 1);
    }

    // collision detection
    for (const m of meteors) {
      // simple AABB‑circle check
      const cx = ship.x + ship.w / 2;
      const cy = ship.y + ship.h / 2;
      const distX = Math.abs(m.x - cx);
      const distY = Math.abs(m.y - cy);
      if (distX > ship.w / 2 + m.r || distY > ship.h / 2 + m.r) continue;
      if (distX <= ship.w / 2 || distY <= ship.h / 2) { playExplosion(); gameOver = true; break; }
      const dx = distX - ship.w / 2;
      const dy = distY - ship.h / 2;
      if (dx * dx + dy * dy <= m.r * m.r) { gameOver = true; break; }
    }
    if (!gameOver) score++;
  }

function draw() {
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship as triangle
    ctx.fillStyle = '#00a';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, '#ff7');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with overlay
    }
  }

  // start
  requestAnimationFrame(loop);
})();
