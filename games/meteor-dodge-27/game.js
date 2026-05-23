// Simple Meteor Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  };
  // Ensure audio context resumes on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  // Ship (triangle)
  const ship = { w: 40, h: 30, x: width / 2, y: height - 30, speed: 300 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      playTone(600, 0.05); // ship movement tick
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Stars for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, speed: 20 + Math.random() * 30 });
  }

  // Meteors
  const meteors = [];
  let lastSpawn = 0;
  let spawnInterval = 800; // ms
  let startTime = null;
  let gameOver = false;

  const drawShip = () => {
    // Draw ship as an upward triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
  };

  const drawMeteor = m => {
    // Meteor with radial gradient for depth
    const grad = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
    grad.addColorStop(0, '#ff8c00'); // bright core
    grad.addColorStop(1, '#8b0000'); // darker edge
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  };

  const update = (delta) => {
    // Ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed * delta;
    if (keys['ArrowRight']) ship.x += ship.speed * delta;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Move stars (twinkling effect)
    for (let s of stars) {
      s.y += s.speed * delta;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
        s.speed = 20 + Math.random() * 30;
      }
    }

    // Spawn meteors
    if (performance.now() - lastSpawn > spawnInterval) {
      meteors.push({ x: Math.random() * width, y: -20, r: 15 + Math.random() * 10, speed: 100 + (performance.now() - startTime) / 10 });
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * delta;
      // Collision detection (circle-rect)
      const dx = Math.max(Math.abs(m.x - ship.x) - ship.w / 2, 0);
      const dy = Math.max(Math.abs(m.y - ship.y) - ship.h / 2, 0);
      if (dx * dx + dy * dy < m.r * m.r) {
        gameOver = true;
        playTone(200, 0.3); // collision sound
      }
      // Remove off‑screen
      if (m.y - m.r > height) meteors.splice(i, 1);
    }
  };

  const draw = () => {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, 2, 2));
    // Ship
    drawShip();
    // Meteors with gradient
    meteors.forEach(drawMeteor);
    // Score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const delta = (timestamp - (loop.last ?? timestamp)) / 1000;
    loop.last = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
