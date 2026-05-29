// Asteroid Dodge game targeting <canvas id="game">
(function () {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player (drawn as a simple triangle spaceship)
  const player = {
    width: 30,
    height: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      // Draw a green triangle representing the ship
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y); // tip
      ctx.lineTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      // Keep inside canvas
      this.x = Math.max(0, Math.min(this.x, width - this.width));
    }
  };

  // Asteroids
  const asteroids = [];
  // Starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5
    });
  }
  // Particle effects for collisions
  const particles = [];

  const asteroidConfig = {
    minSize: 20,
    maxSize: 50,
    minSpeed: 2,
    maxSpeed: 5,
    spawnInterval: 1500 // ms
  };

  function spawnAsteroid() {
    const size = Math.random() * (asteroidConfig.maxSize - asteroidConfig.minSize) + asteroidConfig.minSize;
    const x = Math.random() * (width - size);
    const speed = Math.random() * (asteroidConfig.maxSpeed - asteroidConfig.minSpeed) + asteroidConfig.minSpeed;
    const rotationSpeed = (Math.random() - 0.5) * 0.04; // radians per frame
    asteroids.push({ x, y: -size, size, speed, angle: 0, rotationSpeed });
    // Play spawn sound
    playTone(300, 0.05);
  }

  let lastSpawn = 0;
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  function update(delta) {
    if (gameOver) return;
    player.update();
    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) {
        asteroids.splice(i, 1);
        score++;
      } else if (checkCollision(player, a)) {
        // Create explosion particles
        for (let j = 0; j < 15; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: a.x + a.size / 2,
            y: a.y + a.size / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 2 + 1,
            alpha: 1
          });
        }
        gameOver = true;
        // Play crash sound
        playTone(100, 0.3);
      }
    }
    // Update stars for twinkling/movement
    for (let s of stars) {
      s.y += 0.2; // slow drift
      if (s.y > height) s.y = 0;
    }
    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidConfig.spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Clear with dark space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw player
    player.draw();
    // Draw asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#ff7');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw particles (simple fading circles)
    ctx.globalAlpha = 1.0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = 'rgba(255,255,255,' + p.alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 20);
    }
    // Score and Game Over overlay (drawn once)
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Collision detection (AABB vs circle approximated by bounding box)
  function checkCollision(p, a) {
    const distX = Math.abs(a.x + a.size / 2 - (p.x + p.width / 2));
    const distY = Math.abs(a.y + a.size / 2 - (p.y + p.height / 2));
    if (distX > (p.width / 2 + a.size / 2)) return false;
    if (distY > (p.height / 2 + a.size / 2)) return false;
    return true;
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = false;
  });

  // Start loop
  requestAnimationFrame(loop);
})();
