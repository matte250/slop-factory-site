// Minimal Meteor Defense game
// Canvas with id "game" assumed in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Sound wrappers
  function shootSound() { playTone(600, 0.08); }
  function explosionSound() { playTone(200, 0.2); }
  function gameOverSound() { playTone(100, 0.5); }
  const width = canvas.width;
  const height = canvas.height;

  // Generate background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship definition (triangle shape)
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 6,
    color: '#0f0',
    // precomputed shape points for drawing
    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
  };

  // Input handling
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') fire();
  });
  document.addEventListener('keyup', e => (keys[e.code] = false));
  canvas.addEventListener('click', fire);

  function fire() {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    shootSound();
    projectiles.push({ x: ship.x + ship.w / 2, y: ship.y, r: 4, speed: 8 });
  }

  const projectiles = [];
  const meteors = [];
  let score = 0;
  let gameOver = false;

  // Spawn meteors
  function spawnMeteor() {
    const radius = 12 + Math.random() * 12;
    meteors.push({
      x: Math.random() * (width - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speed: 1 + Math.random() * 2,
      color: '#f44',
    });
  }
  setInterval(spawnMeteor, 1000);

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.y -= p.speed;
      if (p.y < 0) projectiles.splice(i, 1);
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Collision with ship (simple AABB vs circle)
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const distX = Math.abs(m.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(m.y - (shipRect.y + shipRect.h / 2));
      if (distX > shipRect.w / 2 + m.r || distY > shipRect.h / 2 + m.r) {
        // no collision
      } else {
        gameOver = true;
          if (audioCtx.state !== 'running') audioCtx.resume();
          gameOverSound();
        break;
      }
      // Collision with projectiles
      for (let j = projectiles.length - 1; j >= 0; j--) {
        const p = projectiles[j];
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        if (dx * dx + dy * dy < (m.r + p.r) * (m.r + p.r)) {
          meteors.splice(i, 1);
          projectiles.splice(j, 1);
          score++;
          explosionSound();
          break;
        }
      }
      // Remove if out of bounds
      if (m.y - m.r > height) meteors.splice(i, 1);
    }
  }

  function draw() {
    // Space background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ship.draw(ctx);
    // Projectiles (glow)
    projectiles.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Meteors with gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(255,68,68,0.9)');
      grad.addColorStop(1, 'rgba(255,68,68,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
