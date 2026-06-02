// Asteroid Dodge Game
// Canvas id: "game"
(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
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
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.5 + Math.random() * 0.5
    });
  }

  // Player ship
  const ship = {
    x: 50,
    y: height / 2,
    radius: 15,
    speed: 3,
draw() {
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.radius);
    ctx.lineTo(this.x - this.radius, this.y + this.radius);
    ctx.lineTo(this.x + this.radius, this.y + this.radius);
    ctx.closePath();
    ctx.fill();
  }

    update(keys) {
      if (keys.ArrowUp || keys.KeyW) this.y -= this.speed;
      if (keys.ArrowDown || keys.KeyS) this.y += this.speed;
      if (keys.ArrowLeft || keys.KeyA) this.x -= this.speed;
      if (keys.ArrowRight || keys.KeyD) this.x += this.speed;
      // Keep within canvas bounds
      this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    }
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 2;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const y = Math.random() * (height - radius * 2) + radius;
    asteroids.push({ x: width + radius, y, radius, speed: asteroidSpeed + Math.random() * 1.5 });
  }

  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;
  const keys = {};

  // Input handling
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
    // Play thrust sound when moving
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
      beep(300, 0.05);
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.radius + b.radius;
  }

  function update(delta) {
    ship.update(keys);
    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const ast = asteroids[i];
      ast.x -= ast.speed;
      if (ast.x + ast.radius < 0) asteroids.splice(i, 1);
      else if (checkCollision(ship, ast)) {
        // Play collision sound
        beep(100, 0.3);
        // Game over
        cancelAnimationFrame(animationId);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2 - 20);
        ctx.fillText(`Score: ${Math.floor(score)}` , width / 2, height / 2 + 20);
        return false;
      }
    }
    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // Increase score over time
    score += delta * 0.01;
    return true;
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Gradient background (dark space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Update and render starfield
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = width;
        star.y = Math.random() * height;
      }
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (with stroke for better contrast)
    ship.draw();
    ctx.strokeStyle = '#0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.stroke();

    // Draw asteroids with radial gradient shading
    for (const ast of asteroids) {
      const grad = ctx.createRadialGradient(
        ast.x, ast.y, ast.radius * 0.2,
        ast.x, ast.y, ast.radius
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ast.x, ast.y, ast.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  let animationId;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (update(delta)) {
      draw();
      animationId = requestAnimationFrame(loop);
    }
  }

  // Start the game
  animationId = requestAnimationFrame(loop);
})();
