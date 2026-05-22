// Escape the Laser Grid – simple canvas game
// Targets a <canvas id="game"> element.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 800);
  const h = (canvas.height = canvas.clientHeight || 600);

  // Ship state
  const ship = { x: w / 2, y: h - 50, size: 20, speed: 4, inv: 0 };
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, a: false, d: false, w: false, s: false };

  // Laser rows
  let lasers = [];
  const laser = { gap: 40, thickness: 4, speed: 2, interval: 1500 };
  let lastLaser = 0;

  // Power‑ups
  let powerUps = [];
  const pu = { size: 15, duration: 3000, chance: 0.02 };

  let score = 0;
  let start = performance.now();
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }

  // Input
  const setKey = (e, down) => { if (e.key in keys) keys[e.key] = down; };
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    setKey(e, true);
  });
  window.addEventListener('keyup', e => setKey(e, false));
  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // Clamp
    ship.x = Math.max(ship.size, Math.min(w - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(h - ship.size, ship.y));

    // Lasers move down
    lasers.forEach(l => (l.y += laser.speed));
    lasers = lasers.filter(l => l.y < h + laser.thickness);
    // Spawn wave
    if (performance.now() - lastLaser > laser.interval) {
      lastLaser = performance.now();
      const gapStart = Math.random() * (w - laser.gap);
      // left block
      lasers.push({ x: 0, y: -laser.thickness, w: gapStart, h: laser.thickness });
      // right block
      lasers.push({ x: gapStart + laser.gap, y: -laser.thickness, w: w - gapStart - laser.gap, h: laser.thickness });
    }

    // Power‑ups spawn & move
    if (Math.random() < pu.chance) {
      const type = Math.random() < 0.5 ? 'shield' : 'speed';
      powerUps.push({ x: Math.random() * (w - pu.size), y: -pu.size, size: pu.size, type });
    }
    powerUps.forEach(p => (p.y += laser.speed));
    powerUps = powerUps.filter(p => p.y < h + p.size);

    // Collision detection
    if (ship.inv > 0) ship.inv -= dt;
    const shipRect = { x: ship.x - ship.size, y: ship.y - ship.size, w: ship.size * 2, h: ship.size * 2 };
    for (const l of lasers) {
      if (rectIntersect(shipRect, l) && ship.inv <= 0) {
        gameOver = true;
        playTone(150, 0.3); // collision sound
        break;
      }
    }
    // Collect power‑ups
powerUps = powerUps.filter(p => {
    if (!rectIntersect(shipRect, p)) return true;
    if (p.type === 'shield') {
      ship.inv = pu.duration;
      playTone(300, 0.2); // shield pickup
    } else if (p.type === 'speed') {
      ship.speed = 8;
      playTone(500, 0.2); // speed boost
      setTimeout(() => (ship.speed = 4), pu.duration);
    }
    return false;
  });

    // Score based on survival time
    score = Math.floor((performance.now() - start) / 1000);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

function draw() {
  // Gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#001030');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Ship with gradient and outline
  const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.size * 0.2, ship.x, ship.y, ship.size);
  shipGrad.addColorStop(0, ship.inv > 0 ? 'rgba(0,255,0,0.8)' : '#00ffea');
  shipGrad.addColorStop(1, '#0033ff');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - ship.size);
  ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
  ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,255,255,0.6)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0; // reset
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lasers with glow
  ctx.shadowColor = 'rgba(255,0,0,0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(255,0,0,0.9)';
  lasers.forEach(l => ctx.fillRect(l.x, l.y, l.w, l.h));
  ctx.shadowBlur = 0; // reset

  // Power‑ups as glowing circles
  powerUps.forEach(p => {
    const grad = ctx.createRadialGradient(p.x + p.size/2, p.y + p.size/2, p.size*0.1, p.x + p.size/2, p.y + p.size/2, p.size/2);
    if (p.type === 'shield') {
      grad.addColorStop(0, 'rgba(0,255,255,0.9)');
      grad.addColorStop(1, 'rgba(0,150,150,0.4)');
    } else {
      grad.addColorStop(0, 'rgba(255,165,0,0.9)');
      grad.addColorStop(1, 'rgba(150,80,0,0.4)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x + p.size/2, p.y + p.size/2, p.size/2, 0, Math.PI*2);
    ctx.fill();
  });

  // Score with subtle shadow
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 4;
  ctx.fillText(`Score: ${score}s`, 12, 24);
  ctx.shadowBlur = 0;

  // Game over overlay with flicker effect
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff5555';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', w / 2, h / 2);
  }
}

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
