// Simple Pollen Panic game (canvas id="game")
(() => {
  const canvas = document.getElementById('game');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // game settings
  const TARGET_POLLEN = 15;
  const TIME_LIMIT = 30; // seconds

  // player (bee)
  const bee = { x: width / 2, y: height - 50, r: 12, speed: 3, dx: 0, dy: 0 };

  // collections
  const flowers = [];
  const gusts = [];

  let pollenCollected = 0;
  let timeLeft = TIME_LIMIT;
  let lastTime = performance.now();
  let gameOver = false;

  // utility
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // spawn helpers
  function spawnFlower() {
    flowers.push({ x: rand(20, width - 20), y: -20, r: 10, speed: rand(0.5, 1.5) });
  }
  function spawnGust() {
    const w = rand(60, 120);
    gusts.push({ x: rand(0, width - w), y: -30, w, h: 20, speed: rand(1, 2) });
  }

  // input handling
  const keys = {};
  // resume audio context on first interaction
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // move bee
    bee.dx = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0);
    bee.dy = (keys.ArrowUp ? -1 : 0) + (keys.ArrowDown ? 1 : 0);
    bee.x = Math.max(bee.r, Math.min(width - bee.r, bee.x + bee.dx * bee.speed));
    bee.y = Math.max(bee.r, Math.min(height - bee.r, bee.y + bee.dy * bee.speed));

    // spawn objects
    if (Math.random() < 0.02) spawnFlower();
    if (Math.random() < 0.01) spawnGust();

    // update flowers
    for (let i = flowers.length - 1; i >= 0; i--) {
      const f = flowers[i];
      f.y += f.speed;
      // collect
        if (dist(bee, f) < bee.r + f.r) {
          pollenCollected++;
          // play short high‑pitched tone for pollen collection
          playTone(800, 0.1);
          flowers.splice(i, 1);
          continue;
        }
      // out of bounds
      if (f.y - f.r > height) flowers.splice(i, 1);
    }

    // update gusts
    for (let i = gusts.length - 1; i >= 0; i--) {
      const g = gusts[i];
      g.y += g.speed;
      // collision rectangle vs bee circle
        if (bee.x + bee.r > g.x && bee.x - bee.r < g.x + g.w && bee.y + bee.r > g.y && bee.y - bee.r < g.y + g.h) {
          // play low‑pitched tone for collision with gust
          playTone(200, 0.3);
          gameOver = true;
        }
      if (g.y - g.h > height) gusts.splice(i, 1);
    }

    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) gameOver = true;
    if (pollenCollected >= TARGET_POLLEN) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#a8e6cf');
  bgGrad.addColorStop(1, '#dcedc1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // bee with stripes and wings
  ctx.fillStyle = '#f4c20d'; // body
  ctx.beginPath();
  ctx.arc(bee.x, bee.y, bee.r, 0, Math.PI * 2);
  ctx.fill();
  // stripes
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bee.x - bee.r / 2, bee.y - bee.r / 2);
  ctx.lineTo(bee.x + bee.r / 2, bee.y + bee.r / 2);
  ctx.moveTo(bee.x + bee.r / 2, bee.y - bee.r / 2);
  ctx.lineTo(bee.x - bee.r / 2, bee.y + bee.r / 2);
  ctx.stroke();
  // wings
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(bee.x - bee.r / 2, bee.y - bee.r / 2, bee.r, bee.r / 2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bee.x + bee.r / 2, bee.y - bee.r / 2, bee.r, bee.r / 2, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // flowers with petals
  ctx.fillStyle = '#ff69b4'; // center
  flowers.forEach(f => {
    // center
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r / 3, 0, Math.PI * 2);
    ctx.fill();
    // petals
    ctx.fillStyle = '#ffb6c1';
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const px = f.x + Math.cos(angle) * f.r;
      const py = f.y + Math.sin(angle) * f.r;
      ctx.beginPath();
      ctx.ellipse(px, py, f.r / 2, f.r / 3, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ff69b4'; // reset for next center
  });

  // gusts as semi‑transparent curved shapes
  ctx.fillStyle = 'rgba(200,200,255,0.4)';
  gusts.forEach(g => {
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + g.h / 2);
    ctx.quadraticCurveTo(g.x + g.w / 2, g.y - g.h, g.x + g.w, g.y + g.h / 2);
    ctx.lineTo(g.x + g.w, g.y + g.h);
    ctx.quadraticCurveTo(g.x + g.w / 2, g.y + g.h * 1.5, g.x, g.y + g.h);
    ctx.closePath();
    ctx.fill();
  });

  // UI
  ctx.fillStyle = 'black';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Pollen: ${pollenCollected}/${TARGET_POLLEN}`, 10, 20);
  ctx.fillText(`Time: ${Math.max(0, timeLeft.toFixed(1))}s`, 10, 40);
    // UI
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Pollen: ${pollenCollected}/${TARGET_POLLEN}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, timeLeft.toFixed(1))}s`, 10, 40);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // final screen
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      const msg = pollenCollected >= TARGET_POLLEN && timeLeft > 0 ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, width / 2, height / 2);
    }
  }

  requestAnimationFrame(loop);
})();
