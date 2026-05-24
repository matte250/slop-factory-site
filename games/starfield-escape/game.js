// Simple Starfield Escape game targeting <canvas id="game"></canvas>
// Controls: Arrow keys to move ship (up/down/left/right).
// Asteroids spawn on the right and move left. Colliding ends game.
// Fuel cells float left; collecting adds fuel. Ship loses fuel continuously.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Simple sound helper using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur, type='sine', volume=0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  const ship = { x: 50, y: H / 2, w: 20, h: 15, speed: 3 };
  let fuel = 100; // percentage
  const fuelBurnRate = 0.02; // per frame
  const fuelGain = 20; // per cell

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const asteroids = [];
  const fuels = [];
  let frames = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({ x: W + size, y: Math.random() * (H - size), r: size, speed: 2 + Math.random() * 2 });
  }
  function spawnFuel() {
    const size = 8;
    fuels.push({ x: W + size, y: Math.random() * (H - size), r: size, speed: 1.5 });
  }

  function update() {
    // move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep inside bounds
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // fuel consumption
    fuel -= fuelBurnRate;
    if (fuel <= 0) {
      beep(300, 0.3, 'sawtooth', 0.2);
      gameOver = true;
    }

    // spawn entities
    if (frames % 80 === 0) spawnAsteroid();
    if (frames % 300 === 0) spawnFuel();

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // collision with ship (simple circle-rect)
      const dx = Math.max(a.x - (ship.x + ship.w / 2), 0, (ship.x + ship.w / 2) - (a.x + a.r * 2));
      const dy = Math.max(a.y - (ship.y + ship.h / 2), 0, (ship.y + ship.h / 2) - (a.y + a.r * 2));
      if (dx * dx + dy * dy < a.r * a.r) {
        beep(150, 0.4, 'sawtooth', 0.3);
        gameOver = true;
      }
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // update fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      // ship-fuel collision (rect-circle)
      const dx = Math.max(f.x - (ship.x + ship.w / 2), 0, (ship.x + ship.w / 2) - (f.x + f.r * 2));
      const dy = Math.max(f.y - (ship.y + ship.h / 2), 0, (ship.y + ship.h / 2) - (f.y + f.r * 2));
      if (dx * dx + dy * dy < f.r * f.r) {
        fuel = Math.min(100, fuel + fuelGain);
        fuels.splice(i, 1);
      } else if (f.x + f.r < 0) {
        fuels.splice(i, 1);
      }
    }
    frames++;
  }

  function drawStarfield() {
    // enhanced starfield with varying sizes and twinkle
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 150; i++) {
      const size = Math.random() * 2 + 0.5;
      const sx = (Math.random() * W + frames * 0.3) % W;
      const sy = Math.random() * H;
      const alpha = Math.random() * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(sx, sy, size, size);
    }
  }

  function draw() {
    drawStarfield();
    // ship (gradient triangle with outline)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ff00');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 1;
    ctx.stroke();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaaaaa');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cells with glowing gradient
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,165,0,0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      // subtle outer glow
      ctx.strokeStyle = 'rgba(255,255,0,0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
    // fuel meter
    ctx.fillStyle = '#fff';
    ctx.fillText('Fuel: ' + Math.round(fuel) + '%', 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
