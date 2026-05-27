// Simple arcade game with enhanced graphics based on IDEA.md
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;

  // ---- Game constants ----
  const PLANET_RADIUS = 40;
  const SATELLITE_RADIUS = 12;
  const ORBIT_RADIUS = 80;
  const STAR_RADIUS = 6;
  const ASTEROID_RADIUS = 12;
  const STAR_FALL_SPEED = 2;
  const ASTEROID_FALL_SPEED = 3;
  const SPAWN_INTERVAL = 1000; // ms
  const MAX_MISSES = 5;

  // ---- Game state ----
  let angle = 0; // radians
  let angularVelocity = 0;
  const ANGLE_STEP = 0.04; // per frame when key pressed
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure context is running after user interaction
  function ensureAudioContext() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let stars = [];
  let asteroids = [];
  let lastSpawn = 0;
  let score = 0;
  let misses = 0;
  let gameOver = false;

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; ensureAudioContext(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnObject() {
    // 70% star, 30% asteroid
    if (Math.random() < 0.7) {
      stars.push({ x: Math.random() * W, y: -STAR_RADIUS, r: STAR_RADIUS });
    } else {
      asteroids.push({ x: Math.random() * W, y: -ASTEROID_RADIUS, r: ASTEROID_RADIUS });
    }
  }

  function update(dt) {
    if (gameOver) return;
    // rotate satellite
    if (keys['ArrowLeft']) angle -= ANGLE_STEP;
    if (keys['ArrowRight']) angle += ANGLE_STEP;

    // spawn
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObject();
      lastSpawn = performance.now();
    }

    // move falling objects
    const move = (obj, speed) => {
      obj.y += speed;
    };
    stars.forEach(s => move(s, STAR_FALL_SPEED));
    asteroids.forEach(a => move(a, ASTEROID_FALL_SPEED));

    // check collisions with satellite
    const satX = W / 2 + Math.cos(angle) * ORBIT_RADIUS;
    const satY = H / 2 + Math.sin(angle) * ORBIT_RADIUS;
    const checkCollision = (obj) => {
      const dx = obj.x - satX;
      const dy = obj.y - satY;
      const dist = Math.hypot(dx, dy);
      return dist < obj.r + SATELLITE_RADIUS;
    };
    // stars
    stars = stars.filter(s => {
      if (checkCollision(s)) { score++; playTone(800, 0.1); return false; }
      if (s.y - s.r > H) { misses++; return false; }
      return true;
    });
    // asteroids
    asteroids = asteroids.filter(a => {
      if (checkCollision(a)) { gameOver = true; playTone(200, 0.5); return false; }
      if (a.y - a.r > H) return false; // off screen, just discard
      return true;
    });

    if (misses >= MAX_MISSES) gameOver = true;
  }

  function drawBackground() {
    // dark space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // tiny distant stars (twinkling)
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + Math.random() * 0.5) + ')';
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
  }

function drawPlanet() {
    // planet with radial gradient
    const grad = ctx.createRadialGradient(W/2, H/2, PLANET_RADIUS*0.2, W/2, H/2, PLANET_RADIUS);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

function drawOrbit() {
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSatellite() {
    // compute position
    const x = W / 2 + Math.cos(angle) * ORBIT_RADIUS;
    const y = H / 2 + Math.sin(angle) * ORBIT_RADIUS;
    // satellite with slight gradient
    const gradSat = ctx.createRadialGradient(x, y, SATELLITE_RADIUS*0.2, x, y, SATELLITE_RADIUS);
    gradSat.addColorStop(0, '#9cf');
    gradSat.addColorStop(1, '#06c');
    ctx.fillStyle = gradSat;
    ctx.beginPath();
    ctx.arc(x, y, SATELLITE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawObjects() {
    ctx.fillStyle = '#ff0'; // stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#f44'; // asteroids
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Misses: ${misses}/${MAX_MISSES}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, W, H);
    update(dt);
    drawPlanet();
    drawSatellite();
    drawObjects();
    drawHUD();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
