// Simple Canvas Dodge game
// Assumes an HTML canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
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
  function playCollision() { beep(150, 0.4); }
  function playScore() { beep(440, 0.1); }
  const WIDTH = canvas.width = 400;
  const HEIGHT = canvas.height = 600;
  // Starfield background
  const stars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        r: Math.random() * 1.5 + 0.5,
        s: Math.random() * 0.5 + 0.2 // speed for parallax
      });
    }
  }
  initStars();
  function drawStars(dt) {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      star.y += star.s;
      if (star.y > HEIGHT) star.y = 0;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Ship configuration
  const ship = { w: 40, h: 20, x: WIDTH / 2 - 20, y: HEIGHT - 30, speed: 5, vx: 0 };

  // Asteroid configuration
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  // Ensure audio context starts on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (WIDTH - radius * 2) + radius;
    const speed = Math.random() * 2 + 2;
    asteroids.push({ x, y: -radius, r: radius, s: speed });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(WIDTH - ship.w, ship.x));

    // Spawn asteroids
    asteroidTimer += dt;
    if (asteroidTimer > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.s;
      // Check collision with ship (simple AABB vs circle)
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const distX = Math.abs(a.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y - (shipRect.y + shipRect.h / 2));
      if (distX > (shipRect.w / 2 + a.r) || distY > (shipRect.h / 2 + a.r)) {
        // no collision
      } else {
        // collision detected
        playCollision();
        gameOver = true;
      }
      // Remove passed asteroids and increase score
      if (a.y - a.r > HEIGHT) {
        asteroids.splice(i, 1);
        playScore();
        score++;
      }
    }
  }

  function draw(dt) {
    // Dark background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Starfield
    drawStars(dt);
    // Ship (gradient triangle with glow)
    // Apply neon glow using shadow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.x + ship.w);
    shipGradient.addColorStop(0, '#0ff');
    shipGradient.addColorStop(1, '#006');
    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Reset shadow for other elements
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff8');
      grad.addColorStop(1, '#b33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw(dt);
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
