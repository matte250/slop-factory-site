// Simple Asteroid Escape game targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const HEIGHT = canvas.height = 600;

  // Ship definition
  const ship = {
    x: 50,
    y: HEIGHT / 2,
    w: 40,
    h: 30,
    vy: 0,
    speed: 3,
    fuel: 100,
    maxFuel: 100,
  };

  const asteroids = [];
  const fuels = [];
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function spawnAsteroid() {
    const size = 40;
    asteroids.push({
      x: WIDTH + size,
      y: Math.random() * (HEIGHT - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
    });
  }

  function spawnFuel() {
    const size = 30;
    fuels.push({
      x: WIDTH + size,
      y: Math.random() * (HEIGHT - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
    });
  }

  // Timers
  setInterval(spawnAsteroid, 1500);
  setInterval(spawnFuel, 4000);

  function rectsIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;
    // Ship movement
    const moving = keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'];
    if (keys['ArrowUp'] || keys['w']) ship.vy = -ship.speed;
    else if (keys['ArrowDown'] || keys['s']) ship.vy = ship.speed;
    else ship.vy = 0;
    ship.y += ship.vy;
    ship.y = Math.max(0, Math.min(HEIGHT - ship.h, ship.y));
    // Engine thrust sound when moving
    if (moving) playBeep(200, 0.05);
    // Fuel consumption
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) gameOver = true;
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
        else if (rectsIntersect(ship, a)) {
          // Collision sound
          playBeep(150, 0.2);
          gameOver = true;
          break;
        }
    }
    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      if (f.x + f.w < 0) fuels.splice(i, 1);
else if (rectsIntersect(ship, f)) {
          // Fuel pickup sound
          playBeep(400, 0.1);
          ship.fuel = Math.min(ship.maxFuel, ship.fuel + 30);
          fuels.splice(i, 1);
        }
    }
  }

  // Improved draw with starfield, gradients, and shadows
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Starfield background
    if (!window.stars) {
      window.stars = [];
      for (let i = 0; i < 100; i++) {
        window.stars.push({
          x: Math.random() * WIDTH,
          y: Math.random() * HEIGHT,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    window.stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (gradient triangle with shadow)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Asteroids (radial gradient with slight shadow)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2,
        a.x + a.w / 2, a.y + a.h / 2, a.w / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Fuel pickups (glowing green)
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(
        f.x + f.w / 2, f.y + f.h / 2, f.w * 0.2,
        f.x + f.w / 2, f.y + f.h / 2, f.w / 2
      );
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#070');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0,255,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Fuel bar background
    ctx.fillStyle = '#222';
    ctx.fillRect(10, 10, 100, 10);
    // Fuel level (bright green)
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, ship.fuel, 10);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
