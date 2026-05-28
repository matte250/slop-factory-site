// Neon Runner – simple canvas game
// Canvas with id="game" must exist in the HTML.

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Game state
  const ship = { x: 50, y: canvas.height / 2, w: 30, h: 20, vy: 0, energy: 100 };
  const particles = [];
  const obstacles = [];
  let score = 0;
  let speed = 2; // base speed of obstacles
  let lastSpawn = 0;
  let running = true;

  // Input handling
  const keys = {};
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000);
  };
  window.addEventListener('keydown', e => {
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const h = 20 + Math.random() * 30;
    const y = Math.random() * (canvas.height - h);
    obstacles.push({ x: canvas.width, y, w: 20, h, passed: false });
  }

  // Create a small particle for ship trail
  function spawnParticle() {
    particles.push({
      x: ship.x + ship.w,
      y: ship.y + ship.h / 2,
      radius: 2 + Math.random() * 2,
      life: 0,
      maxLife: 30,
    });
  }

  function update(dt) {
    // Ship controls: ArrowUp / ArrowDown for vertical, ArrowRight to accelerate (increase speed)
    if (keys['ArrowUp']) ship.vy = -4;
    else if (keys['ArrowDown']) ship.vy = 4;
    else ship.vy = 0;
    ship.y += ship.vy;
    // Keep ship within canvas
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Accelerate when ArrowRight is held
    if (keys['ArrowRight']) speed += 0.02;
    else speed *= 0.9995; // gradual slowdown

    // Energy drain (faster when accelerating)
    ship.energy -= (keys['ArrowRight'] ? 0.2 : 0.05) * dt;
    if (ship.energy <= 0) running = false;

    // Spawn obstacles every 1.5 seconds
    lastSpawn += dt;
    if (lastSpawn > 1500) { spawnObstacle(); lastSpawn = 0; }

    // Spawn particle trail each frame
    spawnParticle();
    // Update particles (fade and remove)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.x += speed * 0.5; // move with ship forward effect
      if (p.life >= p.maxLife) particles.splice(i, 1);
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // Score when ship passes obstacle
      if (!o.passed && o.x + o.w < ship.x) { o.passed = true; score++; playTone(800, 100); }
      // Remove off‑screen obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision detection (AABB)
      if (ship.x < o.x + o.w && ship.x + ship.w > o.x &&
          ship.y < o.y + o.h && ship.y + ship.h > o.y) {
        playTone(200, 300); // collision sound
        running = false;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#02000e');
    bgGrad.addColorStop(1, '#0a001f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Particles (trail)
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Neon ship – triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00fff7');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.shadowColor = '#00fff7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Obstacles – rounded neon rectangles
    ctx.fillStyle = '#ff0033';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 6;
    obstacles.forEach(o => {
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.w - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      ctx.lineTo(o.x + o.w, o.y + o.h - radius);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      ctx.lineTo(o.x + radius, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // UI – score & energy
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'transparent';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Energy: ${Math.max(0, ship.energy).toFixed(0)}`, 10, 40);
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over screen
      draw();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    }
  }

  requestAnimationFrame(loop);
})();
