// Cosmic Dodge – enhanced graphics
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Audio setup – simple synth beeps
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }

  // Game state
  let score = 0;
  let gameOver = false;
  const keys = { left: false, right: false };

  // Player ship (triangle) – positioned at bottom centre
  const ship = {
    w: 30,
    h: 40,
    x: width / 2,
    y: height - 10,
    speed: 5,
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (keys.left) this.x -= this.speed;
      if (keys.right) this.x += this.speed;
      // keep inside canvas
      this.x = Math.max(this.w / 2, Math.min(width - this.w / 2, this.x));
    }
  };

  // Simple asteroid (circle)
  const asteroids = [];
  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    asteroids.push({
      x: Math.random() * (width - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speed: 2 + Math.random() * 3
    });
  }

  // Star (small circle) for points
  const stars = [];
  function spawnStar() {
    const radius = 3;
    stars.push({
      x: Math.random() * (width - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speed: 1.5 + Math.random() * 1.5
    });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Collision helpers
  function rectCircleCollision(rect, circle) {
    // Approximate ship as rectangle for simplicity
    const dx = Math.abs(circle.x - rect.x);
    const dy = Math.abs(circle.y - rect.y);
    const halfW = rect.w / 2;
    const halfH = rect.h / 2;
    if (dx > halfW + circle.r) return false;
    if (dy > halfH + circle.r) return false;
    if (dx <= halfW) return true;
    if (dy <= halfH) return true;
    const cornerDist = (dx - halfW) ** 2 + (dy - halfH) ** 2;
    return cornerDist <= circle.r ** 2;
  }

  // Main loop
  let lastTime = 0;
  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText('Score: ' + score, width / 2 - 50, height / 2 + 30);
      return;
    }
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // spawn logic
    if (Math.random() < 0.02) spawnAsteroid(); // roughly every 50 frames
    if (Math.random() < 0.01) spawnStar();

    // update objects
    ship.update();
    asteroids.forEach(a => a.y += a.speed);
    stars.forEach(s => s.y += s.speed);

    // remove off‑screen objects
    asteroids.filter(a => a.y - a.r < height);
    stars.filter(s => s.y - s.r < height);
    // actually purge
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y - asteroids[i].r > height) asteroids.splice(i, 1);
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      if (stars[i].y - stars[i].r > height) stars.splice(i, 1);
    }

    // collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
        if (rectCircleCollision(ship, asteroids[i])) {
          gameOver = true;
          // play crash sound
          playBeep(200, 0.5);
          break;
        }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
        if (rectCircleCollision(ship, stars[i])) {
          score += 10;
          // play collect sound
          playBeep(800, 0.1);
          stars.splice(i, 1);
        }
    }

    // draw
    ctx.clearRect(0, 0, width, height);
    // enhanced starfield background with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // subtle moving background stars (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 30; i++) {
      const sx = (Math.random() * width + timestamp * 0.02) % width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // draw moving stars (collectibles) with sparkle fade
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw asteroids with rotation and gradient
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate((a.x + a.y) * 0.01);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // draw ship with stroke and glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ship.draw();
    ctx.restore();

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
