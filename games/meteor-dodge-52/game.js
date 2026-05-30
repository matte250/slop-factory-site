// Meteor Dodge Game
// Canvas must have id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 30,
    width: 20,
    height: 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      // Ship with a blue gradient
      const grad = ctx.createLinearGradient(this.x - this.width / 2, this.y, this.x + this.width / 2, this.y + this.height);
      grad.addColorStop(0, '#00aaff');
      grad.addColorStop(1, '#0077ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x = Math.max(this.width / 2, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.width / 2, this.x + this.speed);
    }
  };

  // Meteor pool
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  const lastSpawn = { time: 0 };

  function spawnMeteor() {
    const radius = Math.random() * 15 + 10;
    meteors.push({
      x: Math.random() * (width - 2 * radius) + radius,
      y: -radius,
      radius,
      speed: Math.random() * 2 + 2
    });
    // play a short whoosh for new meteor
    playSound(200, 'triangle', 0.05);
  }

  function updateMeteors(dt) {
    meteors.forEach(m => { m.y += m.speed; });
    // Remove off‑screen meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].y - meteors[i].radius > height) meteors.splice(i, 1);
    }
  }

  // Draw background gradient and stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }

  function drawBackground() {
    // Sky gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawMeteors() {
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
      grad.addColorStop(0, '#ff7f7f');
      grad.addColorStop(1, '#990000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const m of meteors) {
      const dx = m.x - ship.x;
      const dy = m.y - (ship.y + ship.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < m.radius + ship.width / 2) return true;
    }
    return false;
  }

  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText(`Score: ${Math.floor(score)}`, width / 2, height / 2 + 20);
      return;
    }

    drawBackground();
    ship.update();
    ship.draw();

    if (now - lastSpawn.time > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn.time = now;
    }
    updateMeteors(dt);
    drawMeteors();

    if (checkCollision()) {
      gameOver = true;
      // crash sound
      playSound(80, 'sawtooth', 0.4);
    }

    score += dt / 1000; // seconds survived
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    requestAnimationFrame(loop);
  }

  // Input handling
  // Ensure audio context runs after user interaction
  function unlockAudio(){ if (audioCtx.state !== 'running') audioCtx.resume(); }
  window.addEventListener('keydown', e => {
    unlockAudio();
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
    // optional movement beep
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playSound(400, 'sine', 0.03);
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  // Start loop
  requestAnimationFrame(loop);
})();
