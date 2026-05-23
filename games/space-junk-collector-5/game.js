// Simple Space Junk Collector game
// Targets <canvas id="game"></canvas> in the page

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio utilities
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }
  function beep(freq, duration) {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  }
  // Generate star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }
  function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Player spacecraft
  const player = {
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 50,
    speed: 4,
    dx: 0,
    dy: 0,
draw() {
        // Draw triangular spacecraft
        ctx.fillStyle = '#00f';
        ctx.beginPath();
        ctx.moveTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.closePath();
        ctx.fill();
      }
  };

  // Game entities
  const junk = [];
  const asteroids = [];
  let score = 0;
  let timeLeft = 60; // seconds
  let lastJunkSpawn = 0;
  let lastAsteroidSpawn = 0;
  const spawnIntervalJunk = 1000; // ms
  const spawnIntervalAsteroid = 2000;

  const keys = {};
  window.addEventListener('keydown', e => {
    // Unlock audio on first interaction
    getAudioCtx();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function updatePlayer() {
    player.dx = player.dy = 0;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    if (keys.ArrowUp) player.dy = -player.speed;
    if (keys.ArrowDown) player.dy = player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x + player.dx));
    player.y = Math.max(0, Math.min(height - player.h, player.y + player.dy));
  }

  function spawnJunk() {
    const size = 20;
    junk.push({
      w: size,
      h: size,
      x: Math.random() * (width - size),
      y: -size,
      speed: 2 + Math.random() * 2,
      draw() { ctx.fillStyle = '#0f0'; ctx.fillRect(this.x, this.y, this.w, this.h); }
    });
  }

  function spawnAsteroid() {
    const size = 40;
    const direction = Math.random() < 0.5 ? 1 : -1; // left or right
    asteroids.push({
      w: size,
      h: size,
      x: direction === 1 ? -size : width,
      y: Math.random() * (height / 2),
      speedX: (1 + Math.random() * 2) * direction,
      speedY: 1 + Math.random() * 1,
      draw() { ctx.fillStyle = '#a52a2a'; ctx.fillRect(this.x, this.y, this.w, this.h); }
    });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function updateEntities(delta) {
    // Update junk
    for (let i = junk.length - 1; i >= 0; i--) {
      const j = junk[i];
      j.y += j.speed;
      if (j.y > height) junk.splice(i, 1);
      else if (rectIntersect(player, j)) {
        score++;
          beep(440, 100);
        junk.splice(i, 1);
      }
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.speedX;
      a.y += a.speedY;
      if (a.x > width || a.x + a.w < 0 || a.y > height) asteroids.splice(i, 1);
      else if (rectIntersect(player, a)) {
        // Game over
        gameOver();
        return;
      }
    }
  }

  function drawHUD() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, Math.ceil(timeLeft))}`, width - 100, 20);
  }

  let lastTime = 0;
  let timerId = null;
  function gameOver() {
    cancelAnimationFrame(animId);
    clearInterval(timerId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.font = '32px sans-serif';
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 30);
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    drawStars();
    updatePlayer();
    updateEntities(delta);
    // spawns
    if (timestamp - lastJunkSpawn > spawnIntervalJunk) { spawnJunk(); lastJunkSpawn = timestamp; }
    if (timestamp - lastAsteroidSpawn > spawnIntervalAsteroid) { spawnAsteroid(); lastAsteroidSpawn = timestamp; }
    // draw
    player.draw();
    junk.forEach(j => j.draw());
    asteroids.forEach(a => a.draw());
    drawHUD();
    if (timeLeft > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      gameOver();
    }
  }

  // Start timer
  timerId = setInterval(() => { timeLeft -= 1; }, 1000);
  let animId = requestAnimationFrame(loop);
})();
