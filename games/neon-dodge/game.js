// Simple Neon Dodge game implementation
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

// Player (glowing dot) with trail effect
const trail = [];
const maxTrail = 10;
const player = {
  x: width / 2,
  y: height - 30,
  radius: 8,
  speed: 4,
  color: '#0ff',
  update() {
    // add current position to trail
    trail.push({ x: this.x, y: this.y });
    if (trail.length > maxTrail) trail.shift();
  },
  draw() {
    // draw trail
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const alpha = (i + 1) / trail.length * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.fill();
    }
    // draw player
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};

  // Input handling
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') playBeep(300, 0.08);
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') playBeep(600, 0.08);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Obstacles – rotating neon rectangles
  const obstacles = [];
  const obstacleSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  function spawnObstacle() {
    const size = 30 + Math.random() * 40;
    const x = Math.random() * (width - size) + size / 2;
    const y = -size;
    const speed = 1.5 + Math.random() * 1.5;
    const rotationSpeed = (Math.random() - 0.5) * 0.04;
    const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
    obstacles.push({ x, y, size, speed, angle: 0, rotationSpeed, color });
  }

  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      o.angle += o.rotationSpeed;
      if (o.y - o.size > height) obstacles.splice(i, 1);
    }
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle);
      ctx.fillStyle = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
      ctx.restore();
      ctx.shadowBlur = 0;
    });
  }

  function checkCollision() {
    for (const o of obstacles) {
      // Approximate rectangle as circle for simplicity
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const distance = Math.hypot(dx, dy);
      if (distance < player.radius + o.size / 2) return true;
    }
    // Falling off bottom
    if (player.y - player.radius > height) return true;
    return false;
  }

  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  function loop(now) {
  // Ensure AudioContext is resumed on first interaction
  if (audioCtx.state === 'suspended') {
    const resume = () => { audioCtx.resume(); window.removeEventListener('keydown', resume); };
    window.addEventListener('keydown', resume);
  }
    const delta = now - lastTime;
    lastTime = now;
    if (gameOver) {
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + Math.floor(score), width / 2, height / 2);
      return;
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Player movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
    // Keep within bounds
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    // Update trail
    player.update();

    // Spawn obstacles
    if (now - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = now;
    }

    updateObstacles(delta);
    drawObstacles();
    player.draw();

    // Update score
    score += delta * 0.01;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Score: ' + Math.floor(score), width - 10, 20);

    // Collision check
    if (checkCollision()) { playBeep(150, 0.2); gameOver = true; }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
