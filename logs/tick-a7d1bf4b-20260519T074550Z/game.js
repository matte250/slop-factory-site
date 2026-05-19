// Simple Space Junk Defender game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // create star field
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  const ship = { w: 40, h: 20, x: width / 2, y: height - 30, speed: 0 };
  let shield = false;
  let health = 3;
  let score = 0;
  const meteors = [];
  let lastSpawn = 0;

  // Input handling – click/drag moves ship, mouse down activates shield
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });
  canvas.addEventListener('mousedown', () => { shield = true; playTone(400, 0.1); });
  canvas.addEventListener('mouseup', () => { shield = false; });

  function spawnMeteor() {
    const size = 20 + Math.random() * 15;
    meteors.push({ x: Math.random() * (width - size), y: -size, r: size / 2, vy: 2 + Math.random() * 2 });
  }

  function update(dt) {
    // spawn every 800ms
    if (Date.now() - lastSpawn > 800) { spawnMeteor(); lastSpawn = Date.now(); }
    // update stars (slow drift)
    stars.forEach(s => {
      s.y += 0.2;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });
    // move meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.vy;
      // collision with ship
      const dx = Math.abs(m.x + m.r - ship.x);
      const dy = Math.abs(m.y + m.r - ship.y);
      const coll = dx < ship.w / 2 && dy < ship.h / 2;
      if (coll) {
        if (shield) { score++; meteors.splice(i, 1); continue; }
        health--; meteors.splice(i, 1); if (health <= 0) { gameOver(); return; }
      } else if (m.y - m.r > height) {
        meteors.splice(i, 1); // missed
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship - draw as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // shield
    if (shield) {
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.w, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,255,255,0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    // meteors
    ctx.fillStyle = '#aaa';
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.r,
        m.y + m.r,
        0,
        m.x + m.r,
        m.y + m.r,
        m.r
      );
      grad.addColorStop(0, '#ddd');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.r, m.y + m.r, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${health}`, 10, 40);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  let running = true;
  function gameOver() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f33';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  requestAnimationFrame(loop);
})();
