// Neon Grid Runner – minimal implementation
// Canvas must have id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Simple sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur / 1000);
    osc.start(now);
    osc.stop(now + dur / 1000);
  }

  // Game state
  const ship = { x: width / 2, y: height - 50, w: 30, h: 30, speed: 5, shield: false, shieldTime: 0 };
  const obstacles = [];
  const powerUps = [];
  let lastObstacle = 0, lastPower = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      playTone(400, 100);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 3 });
  }
  function spawnPower() {
    const size = 20;
    powerUps.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2, type: 'shield' });
  }

  function update(dt) {
    if (gameOver) return;
    // move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i, 1);
    }
    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y > height) powerUps.splice(i, 1);
    }
    // spawn logic
    if (performance.now() - lastObstacle > 800) { spawnObstacle(); lastObstacle = performance.now(); }
    if (performance.now() - lastPower > 5000) { spawnPower(); lastPower = performance.now(); }

    // shield timer
    if (ship.shield) {
      ship.shieldTime -= dt;
      if (ship.shieldTime <= 0) ship.shield = false;
    }

    // collision detection
    const hit = (obj) => !(ship.x + ship.w < obj.x || ship.x > obj.x + obj.w || ship.y + ship.h < obj.y || ship.y > obj.y + obj.h);
    // obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (hit(obstacles[i])) {
        if (ship.shield) { ship.shield = false; obstacles.splice(i, 1); }
        else { playTone(120, 300); gameOver = true; }
        break;
      }
    }
    // power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (hit(powerUps[i])) {
        ship.shield = true; ship.shieldTime = 3000; // 3 seconds
        powerUps.splice(i, 1);
      }
    }
  }

  function drawGrid(offset) {
    const spacing = 40;
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offset % spacing; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  let lastTime = performance.now();
  let gridOffset = 0;
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      update(dt);
    }
    // clear with neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // neon grid with glow
    gridOffset += 0.5;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    drawGrid(gridOffset);
    ctx.shadowBlur = 0; // reset for other drawings
    // draw ship as triangle with glow
    ctx.fillStyle = ship.shield ? '#ff0' : '#0f0';
    ctx.shadowColor = ship.shield ? '#ff0' : '#0f0';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // draw obstacles with gradient glow
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#f44';
      ctx.shadowBlur = 6;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.shadowBlur = 0;
    });
    // draw power‑ups as pulsating circles
    powerUps.forEach(p => {
      const pulse = Math.abs(Math.sin(performance.now() / 200)) * 0.5 + 0.5;
      ctx.fillStyle = '#0ff';
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 10 * pulse;
      ctx.beginPath();
      ctx.arc(p.x + p.w/2, p.y + p.h/2, p.w/2, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
