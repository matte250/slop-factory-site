// Enhanced Cosmic Dodger game implementation with improved graphics
// Targets the existing <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
  }


  // Player ship
  const ship = {
    w: 30,
    h: 50,
    x: width / 2 - 15,
    y: height - 60,
    speed: 4,
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Input handling (left/right arrow)
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Obstacles
  const obstacles = [];
  const obsFreq = 90; // frames between spawns
  let frame = 0;
  const obstacleSpeed = 2;

  // Audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.05); }
  function playCollision() { playTone(100, 0.3); }

  // Particle system for thrust
  const particles = [];
  const maxParticles = 100;

  function spawnParticle() {
    // Emit from ship's rear center
    const px = ship.x + ship.w / 2;
    const py = ship.y + ship.h;
    const size = Math.random() * 3 + 2;
    const speed = Math.random() * 1 + 0.5;
    const angle = Math.PI + (Math.random() - 0.5) * 0.4; // spread
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      alpha: 0.9,
      decay: Math.random() * 0.02 + 0.01,
      color: '#0ff',
    });
    if (particles.length > maxParticles) particles.shift();
    // Play thrust sound
    playThrust();
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function spawnObstacle() {
    const size = Math.random() * 30 + 20; // 20-50px
    const x = Math.random() * (width - size);
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // small rotation per frame
    obstacles.push({ x, y: -size, size, speed: obstacleSpeed, angle, rotSpeed });
  }

  function update() {
    // Move ship and emit thrust particles when moving
    const moving = keys.left || keys.right;
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    if (moving) spawnParticle();
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Update particles
    updateParticles();

    // Update obstacles (movement and rotation)
    obstacles.forEach(o => {
      o.y += o.speed;
      o.angle += o.rotSpeed;
    });
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();

    // Collision detection (simple AABB)
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.size &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.size &&
        ship.y + ship.h > o.y
      ) {
        // Game over - play collision sound
        playCollision();
        cancelAnimationFrame(animId);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2);
        ctx.fillText(`Score: ${Math.floor(frame / 60)}`, width / 2, height / 2 + 30);
        return
      }
    }

    // Spawn obstacles
    if (frame % obsFreq === 0) spawnObstacle();
    frame++;
  }

  function draw() {
    // Draw moving starfield background
    drawStars();
    // Draw ship with gradient
    ship.draw();
    // Draw thrust particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // Draw obstacles with rotation
    ctx.fillStyle = '#f44';
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x + o.size / 2, o.y + o.size / 2);
      ctx.rotate(o.angle);
      ctx.beginPath();
      ctx.arc(0, 0, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(frame / 60)}`, 10, 20);
  }

  let animId;
  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Start the game when the page is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loop();
  } else {
    window.addEventListener('DOMContentLoaded', loop);
  }
})();
