// Asteroid Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Pre‑generated star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawBackground() {
    // Space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#000020');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Ship definition
  const ship = {
    width: 30,
    height: 20,
    x: width / 2,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      // Ship with glowing cyan fill
      ctx.save();
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'cyan';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      this.x = Math.max(this.width / 2, Math.min(width - this.width / 2, this.x));
    }
  };

  // Asteroid pool
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 60; // frames

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - 2 * radius) + radius;
    const speed = Math.random() * 2 + 1;
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.04; // rotate slowly
    asteroids.push({ x, y: -radius, radius, speed, angle, angularSpeed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.angle !== undefined) a.angle += a.angularSpeed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    }
    spawnTimer--;
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.angle !== undefined) ctx.rotate(a.angle);
      // radial gradient for 3D look
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y - ship.height / 2;
      const distance = Math.hypot(dx, dy);
      if (distance < a.radius + ship.width / 2) return true;
    }
    return false;
  }

  let score = 0;
  let gameOver = false;

  function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (gameOver) {
      // Dim background on game over
      drawBackground();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    // Render background first
    drawBackground();
    ship.update();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
    if (checkCollision()) {
      gameOver = true;
    } else {
      score++;
    }
    drawScore();
    requestAnimationFrame(loop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  // Play a sound when collision occurs (explosion)
  function playCollisionSound() {
    // Low‑frequency burst
    playBeep(120, 200);
  }

  // Play a subtle tone for each point earned
  function playScoreSound() {
    playBeep(440, 50);
  }

  // Modify loop to trigger sounds
  const originalLoop = loop;
  function loop() {
    if (gameOver) {
      drawBackground();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      // Play collision sound once when game ends
      if (!gameOverPlayed) {
        playCollisionSound();
        gameOverPlayed = true;
      }
      return;
    }
    drawBackground();
    ship.update();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
    if (checkCollision()) {
      gameOver = true;
    } else {
      score++;
      playScoreSound();
    }
    drawScore();
    requestAnimationFrame(loop);
  }

  // Track if game‑over sound played
  let gameOverPlayed = false;

  // Start the game
  requestAnimationFrame(loop);
})();
