// Asteroid Dodge game implementation
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size if not set in HTML
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Player ship
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    w: 40,
    h: 20,
    speed: 5,
    dx: 0,
    dy: 0,
    draw() {
      // Ship as a triangle
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(this.w / 2, this.h / 2);
      ctx.lineTo(-this.w / 2, this.h / 2);
      ctx.closePath();
      ctx.fill();
      // Engine flame when moving
      if (this.dx !== 0 || this.dy !== 0) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(0, this.h / 2);
        ctx.lineTo(this.w / 4, this.h / 2 + 10);
        ctx.lineTo(-this.w / 4, this.h / 2 + 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside canvas
      this.x = Math.max(this.w / 2, Math.min(canvas.width - this.w / 2, this.x));
      this.y = Math.max(this.h / 2, Math.min(canvas.height - this.h / 2, this.y));
    },
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 2;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const y = Math.random() * (canvas.height / 2);
    const x = side === 'left' ? -radius : canvas.width + radius;
    const speedX = side === 'left' ? asteroidSpeed + Math.random() : -asteroidSpeed - Math.random();
    const speedY = (Math.random() - 0.5) * 1.5;
    asteroids.push({ x, y, radius, speedX, speedY });
  }

  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;

  function drawScore() {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + Math.max(ship.w, ship.h) / 2) {
        return true;
      }
    }
    return false;
  }

  function gameLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastSpawn || timestamp);
    if (delta > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    // Clear and draw background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Update and draw stars (simple scrolling effect)
    const starSpeed = 0.3;
    ctx.fillStyle = 'white';
    for (const s of stars) {
      s.y += starSpeed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update and draw asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.speedX;
      a.y += a.speedY;
      // remove off‑screen
      if (a.x < -a.radius || a.x > canvas.width + a.radius || a.y < -a.radius || a.y > canvas.height + a.radius) {
        asteroids.splice(i, 1);
        continue;
      }
      // Asteroid with radial gradient and outline
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#ccc');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      // subtle outline
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ship.update();
    ship.draw();
    drawScore();

    if (checkCollision()) {
      gameOver = true;
      // Play collision sound
      playTone(100, 0.3);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      const finalScore = ((timestamp - startTime) / 1000).toFixed(1);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${finalScore}s`, canvas.width / 2, canvas.height / 2 + 40);
      return; // stop loop
    }

    requestAnimationFrame(gameLoop);
  }

  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Keyboard controls
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
    updateMovement();
    // Play thrust sound when movement starts
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      playTone(200, 0.05);
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    updateMovement();
  });
  function updateMovement() {
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
  }

  // Start the game
  requestAnimationFrame(gameLoop);
})();
