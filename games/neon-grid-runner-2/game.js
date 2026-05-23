// Simple Neon Grid Runner game
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: width / 2, y: height * 0.8, w: 20, h: 30, speed: 4 };
  const keys = {};
  const obstacles = [];
  const powerUps = [];
  let lastObstacle = 0;
  let lastPower = 0;
  const obstacleInterval = 1200; // ms
  const powerInterval = 4000;
  let startTime = null;
  let energy = 100; // percent
  const energyDecay = 0.02; // per frame
  const energyGain = 20;
  const duration = 60 * 1000; // 60 seconds
  let gameOver = false;
  let win = false;

  // Input handling
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  window.addEventListener('mousedown', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, dur, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }

  function playCollision() { playTone(100, 200, 'square'); }
  function playPower() { playTone(600, 150, 'triangle'); }
  function playWin() { playTone(800, 400, 'sawtooth'); }
  function playLose() { playTone(120, 400, 'sawtooth'); }
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    ship.x = mx;
    ship.y = my;
  });

  function spawnObstacle() {
    const size = 30 + Math.random() * 40;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }

  function spawnPowerUp() {
    const size = 20;
    const x = Math.random() * (width - size);
    powerUps.push({ x, y: -size, w: size, h: size, speed: 1.5, collected: false });
  }

  function update(delta) {
    // Controls (arrow keys)
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Clamp
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Obstacles
    obstacles.forEach(o => o.y += o.speed);
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();

    // Power‑ups
    powerUps.forEach(p => p.y += p.speed);
    while (powerUps.length && powerUps[0].y > height) powerUps.shift();

    // Collision detection
    obstacles.forEach(o => {
        if (rectIntersect(ship, o)) {
          playCollision();
          endGame(false);
        }
    });
    powerUps.forEach(p => {
      if (!p.collected && rectIntersect(ship, p)) {
        p.collected = true;
        playPower();
        energy = Math.min(100, energy + energyGain);
      }
    });

    // Energy decay
    energy -= energyDecay * delta;
    if (energy <= 0) endGame(false);

    // Win condition
    if (Date.now() - startTime >= duration) endGame(true);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function drawGrid() {
    // Fill background with dark neon gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Set grid style with subtle neon glow
    const gridGrad = ctx.createLinearGradient(0, 0, width, height);
    gridGrad.addColorStop(0, 'rgba(0,255,255,0.05)');
    gridGrad.addColorStop(1, 'rgba(0,128,255,0.05)');
    ctx.strokeStyle = gridGrad;
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 4;
    const gridSize = 40;
    ctx.strokeStyle = 'rgba(0,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    // Ship (neon triangle with glow)
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.lineTo(ship.x - ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Obstacles with neon glow
    ctx.save();
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 8;
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w*0.2, o.x + o.w/2, o.y + o.h/2, o.w);
      grad.addColorStop(0, '#ff4');
      grad.addColorStop(1, '#f00');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.restore();
    // Power‑ups with neon pulse
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 12;
    powerUps.forEach(p => {
      if (!p.collected) {
        const grad = ctx.createRadialGradient(p.x + p.w/2, p.y + p.h/2, p.w*0.2, p.x + p.w/2, p.y + p.h/2, p.w);
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#f80');
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    });
    ctx.restore();
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`, 10, 20);
    ctx.fillText(`Energy: ${Math.max(0, energy).toFixed(0)}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = win ? '#0f0' : '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(win ? 'YOU SURVIVED!' : 'GAME OVER', width / 2, height / 2);
    }
  }

  function endGame(isWin) {
    // Play appropriate sound
    if (isWin) {
      playWin();
    } else {
      playLose();
    }
    gameOver = true;
    win = isWin;
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const delta = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    if (!gameOver) {
      // Spawn obstacles/power‑ups based on elapsed time
      if (Date.now() - lastObstacle > obstacleInterval) { spawnObstacle(); lastObstacle = Date.now(); }
      if (Date.now() - lastPower > powerInterval) { spawnPowerUp(); lastPower = Date.now(); }
      update(delta);
    }
    render();
    requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
