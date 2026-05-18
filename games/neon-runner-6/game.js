// Simple Neon Runner game
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  let crashPlayed = false;
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Stars for background
  let stars = [];
  const generateStars = () => {
    const count = Math.max(100, Math.floor((canvas.width * canvas.height) / 8000));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }
  };

  // Set canvas size to fill its container and generate stars
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateStars();
  };
  resize();
  window.addEventListener('resize', resize);

  // Player – a glowing dot
  const player = {
    radius: 8,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 2,
    vx: 0,
    color: '#0ff',
    update() {
      this.x += this.vx;
      // keep inside bounds
      if (this.x < this.radius) this.x = this.radius;
      if (this.x > canvas.width - this.radius) this.x = canvas.width - this.radius;
    },
    draw() {
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, 'rgba(0,255,255,0.8)');
      grad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Obstacles – simple rectangles
  const obstacles = [];
  const obstacleSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const obstacleSpeedBase = 1.5;

  function spawnObstacle() {
    // sound for new obstacle
    playBeep(300, 0.05);
    const width = 30 + Math.random() * 40;
    const x = Math.random() * (canvas.width - width);
    obstacles.push({ x, y: -20, width, height: 20, speed: obstacleSpeedBase });
  }

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'a') keys['a'] = true;
    if (e.key === 'd') keys['d'] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
    if (e.key === 'a') keys['a'] = false;
    if (e.key === 'd') keys['d'] = false;
  });

  // Game state
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  function update(delta) {
    // handle input
    player.vx = 0;
    if (keys.ArrowLeft || keys.a) player.vx = -player.speed;
    if (keys.ArrowRight || keys.d) player.vx = player.speed;
    player.update();

    // spawn obstacles
    if (performance.now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed + (score / 1000); // speed increases with distance
      if (o.y > canvas.height) obstacles.splice(i, 1);
      // collision detection (circle vs rect)
      const distX = Math.abs(player.x - (o.x + o.width / 2));
      const distY = Math.abs(player.y - (o.y + o.height / 2));
      if (distX > (o.width / 2 + player.radius) || distY > (o.height / 2 + player.radius)) continue;
      if (distX <= o.width / 2 || distY <= o.height / 2) { if (!crashPlayed) { playBeep(150, 0.2); crashPlayed = true; } gameOver = true; }
      const dx = distX - o.width / 2;
      const dy = distY - o.height / 2;
      if (dx * dx + dy * dy <= player.radius * player.radius) { gameOver = true; }
    }

    // update score (distance traveled)
    score = Math.floor((performance.now() - startTime) / 10);
  }

  function draw() {
    // fade previous frame for motion blur effect
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw star background (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // draw player with glow (already uses radial gradient)
    player.draw();

    // draw obstacles with neon glow
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.height);
      grad.addColorStop(0, 'rgba(255,0,255,0.8)');
      grad.addColorStop(1, 'rgba(255,0,255,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      // outer glow effect
      ctx.shadowColor = 'rgba(255,0,255,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.shadowBlur = 0;
    });
    ctx.shadowColor = 'transparent';

    // draw score
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px monospace';
      ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
