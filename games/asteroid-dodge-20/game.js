// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill its container or window
  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Starfield background
  let stars = [];
  const starCount = 100;
  function initStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5
      });
    }
  }
  initStars();

  // Update stars on resize
  window.addEventListener('resize', () => {
    initStars();
  });

  // ---- Game objects ----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 12,
    speed: 3,
    vx: 0,
    vy: 0,
    color: '#0ff'
  };

  const asteroids = [];
  const asteroidConfig = {
    minSize: 10,
    maxSize: 30,
    minSpeed: 1,
    maxSpeed: 4,
    spawnInterval: 800 // ms
  };

  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;
  const keys = {};

  // ---- Input ----
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ---- Sound setup ----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure audio context runs after user interaction (required by browsers)
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, length) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + length);
  }
  function playThrust() { playTone(400, 0.05); }
  function playScore() { playTone(800, 0.07); }
  function playCrash() { playTone(150, 0.3); }

  function updateShip() {
    ship.vx = 0; ship.vy = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.vx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.vx = ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.vy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.vy = ship.speed;

    ship.x += ship.vx;
    ship.y += ship.vy;

    // screen wrap‑around
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // play thrust sound when moving
    if (ship.vx !== 0 || ship.vy !== 0) {
      playThrust();
    }
  }

  function spawnAsteroid() {
    const size = Math.random() * (asteroidConfig.maxSize - asteroidConfig.minSize) + asteroidConfig.minSize;
    const speed = Math.random() * (asteroidConfig.maxSpeed - asteroidConfig.minSpeed) + asteroidConfig.minSpeed;
    asteroids.push({
      x: Math.random() * canvas.width,
      y: -size,
      r: size,
      speed,
      color: '#f44'
    });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > canvas.height) {
        asteroids.splice(i, 1);
        score++;
        playScore();
        continue;
      }
      // simple circle‑circle collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        playCrash();
        gameOver = true;
      }
    }
  }

  function drawShip() {
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.radius, ship.x, ship.y + ship.radius);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0088ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
  }

  function drawStars() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`,
      10, 20);
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
      return;
    }

    drawStars();

    const now = performance.now();
    if (now - lastSpawn > asteroidConfig.spawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }

    updateShip();
    updateAsteroids(now - lastSpawn);
    drawShip();
    drawAsteroids();
    drawScore();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
