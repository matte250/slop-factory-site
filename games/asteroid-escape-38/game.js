// Simple Asteroid Escape game based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(function () {
  // ----- Setup -----
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);

  // ----- Enhanced graphics setup -----
  // create starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // ----- Game state -----
  const ship = {
    x: width / 2,
    y: height - 60,
    angle: 0, // radians
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.15,
    turnSpeed: 0.07,
    damping: 0.99,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, a: false, d: false, w: false, s: false };
  const asteroids = [];
  let spawnTimer = 0;
  let score = 0;
  let gameOver = false;

  // ----- Input & Audio -----
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustOsc.type = 'sawtooth';
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    // start thrust sound when thrust key pressed
    if ((e.key === 'ArrowUp' || e.key === 'w') && !thrustOsc) {
      // resume context if needed
      if (audioCtx.state === 'suspended') audioCtx.resume();
      startThrustSound();
    }
    if (gameOver && (e.key === 'r' || e.key === 'R')) {
      resetGame();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
    if ((e.key === 'ArrowUp' || e.key === 'w') && thrustOsc) {
      stopThrustSound();
    }
  });

  // ----- Helper functions -----
  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const x = Math.random() * (width - 2 * radius) + radius;
    const y = -radius;
    const speed = 1 + Math.random() * 2;
    asteroids.push({ x, y, radius, speed });
  }

  function updateShip() {
    // rotation
    if (keys.ArrowLeft || keys.a) ship.angle -= ship.turnSpeed;
    if (keys.ArrowRight || keys.d) ship.angle += ship.turnSpeed;
    // thrust
    if (keys.ArrowUp || keys.w) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // apply damping / inertia
    ship.vx *= ship.damping;
    ship.vy *= ship.damping;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // keep within bounds (wrap around horizontally)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y = 0; // prevent leaving top
    if (ship.y > height) ship.y = height; // bottom stop
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt;
      if (a.y - a.radius > height) {
        // asteroid left screen, count as avoided
        asteroids.splice(i, 1);
        score += 1;
      }
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // play explosion sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playExplosionSound();
        gameOver = true;
        break;
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.restore();
  }

  function drawAsteroids() {
    // draw asteroids with radial gradient for depth
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText('Press R to Restart', width / 2, height / 2 + 30);
    }
  }

  function resetGame() {
    ship.x = width / 2;
    ship.y = height - 60;
    ship.angle = 0;
    ship.vx = ship.vy = 0;
    asteroids.length = 0;
    score = 0;
    gameOver = false;
  }

  window.addEventListener('keydown', (e) => {
    if (gameOver && (e.key === 'r' || e.key === 'R')) {
      resetGame();
    }
  });

  // ----- Main loop -----
  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 16; // roughly 60fps scaling factor
    lastTime = now;
    if (!gameOver) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnAsteroid();
        spawnTimer = 60 + Math.random() * 60; // spawn every 1-2 seconds (in dt units)
      }
      updateShip();
      updateAsteroids(dt);
      checkCollision();
    }

    // render
    // dark background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, width, height);
    drawStars();
    drawShip();
    drawAsteroids();
    drawHUD();

    requestAnimationFrame(loop);
  }

  // start after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(loop));
  } else {
    requestAnimationFrame(loop);
  }
})();
