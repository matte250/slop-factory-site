// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  function playTone(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  function playShoot() {
    playTone(600, 0.1);
  }

  function playExplosion() {
    // noise burst
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    noise.connect(filter).connect(audioCtx.destination);
    noise.start();
  }

  function playGameOver() {
    playTone(200, 0.5);
  }

  // Ensure audio context resumes on user interaction
  window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });

  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Game state
  let score = 0;
  let lives = 3;
  let lastTime = 0;
  let gameOver = false;

  // Ship – simple rectangle
  const ship = {
    width: 40,
    height: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 300, // px per second
    color: '#0f0'
  };

  const bullets = [];
  const asteroids = [];
  // Star field for background
  const stars = [];
  // Initialize stars
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 1,
      speed: 20 + Math.random() * 30
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    asteroids.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      radius: size / 2,
      speed: 100 + Math.random() * 100,
      color: '#a52a2a'
    });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowLeft'] && ship.x > 0) ship.x -= ship.speed * dt;
    if (keys['ArrowRight'] && ship.x + ship.width < WIDTH) ship.x += ship.speed * dt;
    // Shooting
    if (keys['Space']) {
      // simple rate limit
      if (!ship.lastShot || Date.now() - ship.lastShot > 300) {
        bullets.push({ x: ship.x + ship.width / 2, y: ship.y, dy: -500, radius: 3 });
        ship.lastShot = Date.now();
        playShoot();
      }
    }
    // Update stars (background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed * dt;
      if (s.y > HEIGHT) {
        s.y = 0;
        s.x = Math.random() * WIDTH;
        s.size = Math.random() * 2 + 1;
        s.speed = 20 + Math.random() * 30;
      }
    }
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y += b.dy * dt;
      if (b.y < 0) bullets.splice(i, 1);
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt;
      if (a.y - a.radius > HEIGHT) {
        asteroids.splice(i, 1);
        continue;
      }
      // Check bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const dx = b.x - (a.x + a.radius);
        const dy = b.y - (a.y + a.radius);
        const dist2 = dx * dx + dy * dy;
        if (dist2 < (b.radius + a.radius) * (b.radius + a.radius)) {
          // destroy both
          bullets.splice(j, 1);
          asteroids.splice(i, 1);
          score += 10;
          playExplosion();
          break;
        }
      }
      // Check ship collision
      if (
        ship.x < a.x + a.radius * 2 &&
        ship.x + ship.width > a.x &&
        ship.y < a.y + a.radius * 2 &&
        ship.y + ship.height > a.y
      ) {
        asteroids.splice(i, 1);
        lives--;
        if (lives <= 0) {
          gameOver = true;
        }
      }
    }
    // Random asteroid spawn
    if (Math.random() < dt * 0.8) spawnAsteroid();
  }

  function draw() {
    // Background (star field)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Ship – draw as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Bullets – glow effect
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset

    // Asteroids – radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.radius,
        a.y + a.radius,
        a.radius * 0.2,
        a.x + a.radius,
        a.y + a.radius,
        a.radius
      );
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.radius, a.y + a.radius, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'transparent';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
