// Simple Orbit Dodge game targeting <canvas id="game"></canvas>
// Enhanced graphics: background stars, planet gradient, shadows, thrust flame
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // generate background stars
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
  }
  const planet = { x: W / 2, y: H / 2, r: 30 };

  // Ship state
  const ship = {
    angle: 0, // radians from positive x axis
    radius: 80, // distance from planet centre
    size: 10,
    speed: 0,
    angularSpeed: 0.03,
    thrust: 0.5,
    pull: 0.01 // gravity toward planet
  };

  // Asteroid pool
  const asteroids = [];
  const spawnInterval = 2000; // ms
  let lastSpawn = 0;

  let startTime = null;
  let gameOver = false;

  // Input handling and sound setup
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    thrustOsc.osc.stop(audioCtx.currentTime + 0.06);
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.stop(audioCtx.currentTime + 0.31);
  }
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') {
      audioCtx.resume();
      startThrustSound();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') {
      stopThrustSound();
    }
  });

  function spawnAsteroid() {
    // spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    if (side === 0) { // top
      x = Math.random() * W; y = -20;
    } else if (side === 1) { // right
      x = W + 20; y = Math.random() * H;
    } else if (side === 2) { // bottom
      x = Math.random() * W; y = H + 20;
    } else { // left
      x = -20; y = Math.random() * H;
    }
    // direction toward planet centre
    const dx = planet.x - x;
    const dy = planet.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, r: 12 + Math.random() * 8 });
  }

  function update(dt) {
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.angularSpeed;
    if (keys['ArrowRight']) ship.angle += ship.angularSpeed;
    if (keys['ArrowUp']) ship.radius += ship.thrust; // thrust outward
    // gravity pulls ship inward
    ship.radius -= ship.pull;
    // bound radius
    if (ship.radius < 40) ship.radius = 40;
    if (ship.radius > Math.min(W, H) / 2 - 20) ship.radius = Math.min(W, H) / 2 - 20;

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove if offscreen
      if (a.x < -50 || a.x > W + 50 || a.y < -50 || a.y > H + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision with ship
      const sx = planet.x + Math.cos(ship.angle) * ship.radius;
      const sy = planet.y + Math.sin(ship.angle) * ship.radius;
      const dist = Math.hypot(a.x - sx, a.y - sy);
if (dist < a.r + ship.size) {
          gameOver = true;
          playExplosionSound();
        }
    }

    // spawn new asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // planet with radial gradient and subtle shadow
    const planetGrad = ctx.createRadialGradient(
      planet.x - planet.r / 3, planet.y - planet.r / 3, planet.r / 5,
      planet.x, planet.y, planet.r
    );
    planetGrad.addColorStop(0, '#a2ffb0');
    planetGrad.addColorStop(1, '#2b8a3e');
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // ship
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - Math.cos(ship.angle) * ship.size, sy - Math.sin(ship.angle) * ship.size);
    ctx.lineTo(sx - Math.cos(ship.angle + Math.PI / 2) * ship.size, sy - Math.sin(ship.angle + Math.PI / 2) * ship.size);
    ctx.closePath();
    ctx.fill();
    // thrust flame when accelerating
    if (keys['ArrowUp']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      const fx = sx - Math.cos(ship.angle) * (ship.size + 4);
      const fy = sy - Math.sin(ship.angle) * (ship.size + 4);
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx - Math.cos(ship.angle + Math.PI / 4) * 6, fy - Math.sin(ship.angle + Math.PI / 4) * 6);
      ctx.lineTo(fx - Math.cos(ship.angle - Math.PI / 4) * 6, fy - Math.sin(ship.angle - Math.PI / 4) * 6);
      ctx.closePath();
      ctx.fill();
    }

    // asteroids with simple gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#d99');
      grad.addColorStop(1, '#822');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // score / game over text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f55';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
