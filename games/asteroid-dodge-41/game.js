// Game: Asteroid Dodge
// Assumes a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship parameters
  const ship = {
    x: 50,
    y: height / 2,
    w: 30,
    h: 20,
    vy: 0,
  };
  const GRAVITY = 0.4;
  const THRUST = -8;

  // Starfield
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      c: `rgba(255,255,255,${0.3 + Math.random() * 0.7})`
    });
  }
  // Asteroid pool
  const asteroids = [];
  const ASTEROID_FREQ = 1200; // ms
  const ASTEROID_SPEED = 3;
  const ASTEROID_MIN_SIZE = 20;
  const ASTEROID_MAX_SIZE = 60;

  let lastAsteroid = 0;
  let score = 0;
  let running = true;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple sound generators
  function playTone(frequency, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const playThrustSound = () => playTone(300, 100);
  const playCrashSound = () => playTone(100, 300);
  const playScoreSound = () => playTone(600, 80);

  // Input handling
  const thrust = () => { ship.vy = THRUST; playThrustSound(); audioCtx.resume(); };
  const release = () => { /* gravity will apply */ };
  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('mouseup', release);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); });
  canvas.addEventListener('touchend', e => { e.preventDefault(); release(); });

  function spawnAsteroid() {
    const size = Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE) + ASTEROID_MIN_SIZE;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
    });
  }

  function update(dt) {
    // Ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    if (ship.y < 0) ship.y = 0;
    if (ship.y + ship.h > height) ship.y = height - ship.h;

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= ASTEROID_SPEED;
        if (a.x + a.w < 0) {
          asteroids.splice(i, 1);
          score++;
          playScoreSound();
        } else if (rectIntersect(ship, a)) {
          playCrashSound();
          running = false;
        }
    }

    // Spawn new asteroids
    if (Date.now() - lastAsteroid > ASTEROID_FREQ) {
      spawnAsteroid();
      lastAsteroid = Date.now();
    }
  }

function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars (twinkling)
    stars.forEach(star => {
      ctx.fillStyle = star.c;
      ctx.fillRect(star.x, star.y, 2, 2);
    });

    // Ship (gradient triangle for nicer look)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffea');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2,
        a.x + a.w / 2, a.y + a.h / 2, a.w / 2
      );
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.fillRect(a.x, a.y, a.w, a.h);
    });

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`,
      10, 20);
  }

  function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
      r2.x + r2.w < r1.x ||
      r2.y > r1.y + r1.h ||
      r2.y + r2.h < r1.y);
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 20);
    }
  }

  requestAnimationFrame(loop);
})();
