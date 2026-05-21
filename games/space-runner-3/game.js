// Simple Space Runner game with improved graphics
// Canvas with id="game" expected in the page
// Added star field background, gradient rocket, and shaded asteroids

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  // Create starfield background
  const stars = [];
  const starCount = Math.floor(width * height / 8000);
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
  const starSpeed = 0.02; // pixels per ms
  function updateStars(dt) {
    stars.forEach(s => {
      s.x -= starSpeed * dt;
      if (s.x < 0) s.x += width;
    });
  }
  function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Player rocket
  const player = {
    x: 60,
    y: height / 2,
    w: 30,
    h: 20,
    vy: 0,
    speed: 0.4,
    boost: -0.8,
    draw() {
      // Gradient rocket body
      const grad = ctx.createLinearGradient(this.x - this.w, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#0077ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
      // Engine flame when boosting up
      if (keys['ArrowUp']) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x - this.w, this.y);
        ctx.lineTo(this.x - this.w - 10, this.y - this.h / 4);
        ctx.lineTo(this.x - this.w - 10, this.y + this.h / 4);
        ctx.closePath();
        ctx.fill();
      }
    },
    update(dt) {
      this.vy += this.speed * (keys['ArrowUp'] ? this.boost : 0) * dt;
      this.vy *= 0.98; // damping
      this.y += this.vy * dt;
      // keep inside canvas
      if (this.y < this.h / 2) this.y = this.h / 2;
      if (this.y > height - this.h / 2) this.y = height - this.h / 2;
    }
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      size,
      speed: 0.2 + Math.random() * 0.3,
      draw() {
        // Shaded asteroid with radial gradient
        const grad = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size / 2);
        grad.addColorStop(0, '#ddd');
        grad.addColorStop(1, '#777');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      },
      update(dt) {
        this.x -= this.speed * dt;
      }
    });
  }

  // Input handling
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  window.addEventListener('keydown', e => {
    if (!keys[e.key]) { // only on initial press
      if (e.key === 'ArrowUp') playTone(400, 0.08);
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Game loop
  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;

    // Draw background
    drawStars();
    // Update background stars
    updateStars(dt);

    // Update player
    player.update(dt);
    player.draw();

    // Spawn asteroids
    if (now - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }

    // Update and draw asteroids, remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update(dt);
      a.draw();
      if (a.x + a.size < 0) asteroids.splice(i, 1);
        // Collision detection (simple AABB vs circle)
        const dx = Math.abs(a.x - player.x);
        const dy = Math.abs(a.y - player.y);
        if (dx < a.size / 2 + player.w && dy < a.size / 2 + player.h / 2) {
          // Play collision sound
          playTone(200, 0.2);
          // Game over – stop loop
          ctx.fillStyle = 'red';
          ctx.font = '48px sans-serif';
          ctx.fillText('Game Over', width / 2 - 100, height / 2);
          return; // stop animation
        }

    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
