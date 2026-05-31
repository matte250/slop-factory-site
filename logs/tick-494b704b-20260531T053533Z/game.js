// Simple endless runner: Cosmic Dodger
// Canvas with id="game" defined in HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.05); }
  function playCollision() { playTone(100, 0.3); }

  // Ship definition
  const ship = {
    x: 80,
    y: height / 2,
    w: 30,
    h: 20,
    dy: 0,
    speed: 4,
    draw() {
      const grad = ctx.createLinearGradient(this.x - this.w, this.y - this.h / 2, this.x, this.y);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#8f8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      // Keep within bounds
      if (this.y < this.h / 2) this.y = this.h / 2;
      if (this.y > height - this.h / 2) this.y = height - this.h / 2;
    }
  };

  // Simple thrust particles for visual feedback
  const thrustParticles = [];
  function spawnThrust() {
    thrustParticles.push({
      x: ship.x - ship.w,
      y: ship.y + (Math.random() - 0.5) * ship.h,
      vx: -2 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 1.5,
      life: 30,
    });
  }
  function updateThrust() {
    for (let i = thrustParticles.length - 1; i >= 0; i--) {
      const p = thrustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) thrustParticles.splice(i, 1);
    }
  }
  function drawThrust() {
    ctx.fillStyle = 'rgba(255,140,0,0.8)';
    thrustParticles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Asteroid pool


  // Starfield for background
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    twinkle: Math.random() * 0.5 + 0.5,
  }));
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.twinkle;
      ctx.fillRect(s.x, s.y, s.size, s.size);
      // slight movement for parallax effect
      s.x -= 0.2;
      if (s.x < 0) s.x = width;
    });


  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size,
    });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    if (frameCount % asteroidInterval === 0) spawnAsteroid();
  }

  function drawAsteroids() {
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Simple collision detection (circle-rect approximation)
  function checkCollision() {
    for (const a of asteroids) {
      const dx = Math.max(ship.x - ship.w, Math.min(a.x, ship.x));
      const dy = Math.max(ship.y - ship.h / 2, Math.min(a.y, ship.y + ship.h / 2));
      const dist = Math.hypot(a.x - dx, a.y - dy);
      if (dist < a.r) return true;
    }
    return false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault(); // placeholder for firing
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function handleInput() {
    ship.dy = 0;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
    // Generate thrust and sound when accelerating
    if (ship.dy !== 0) {
      spawnThrust();
      playThrust();
    }
  }

  // Score
  let score = 0;
  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  // Main loop
  function loop() {
    // Draw background and particles first
    drawStars();
    updateThrust();
    drawThrust();
    handleInput();
    ship.update();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
    if (checkCollision()) {
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
      return; // stop animation
    }
    score++;
    drawScore();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
