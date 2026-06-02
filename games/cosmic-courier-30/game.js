// Minimal Cosmic Courier game with sound effects
// Assumes an existing <canvas id="game"></canvas>

(() => {
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  let boostOsc = null;
  const startBoostSound = () => {
    if (boostOsc) return;
    boostOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    boostOsc.frequency.value = 300;
    boostOsc.type = 'sawtooth';
    boostOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    boostOsc.start();
  };
  const stopBoostSound = () => {
    if (!boostOsc) return;
    boostOsc.stop();
    boostOsc.disconnect();
    boostOsc = null;
  };


  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // ----- game state -----
  const ship = {
    x: W / 2,
    y: H - 80,
    radius: 12,
    vx: 0,
    vy: -1.5, // constant forward drift (upwards)
    fuel: 100,
    thrust: 0,
    boost: false,
  };
  const asteroids = [];
  const packages = [];
  const fuels = [];
  let score = 0;
  let gameOver = false;
  const keys = {};

  // ----- helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const spawnAsteroid = () => {
    asteroids.push({
      x: rand(20, W - 20),
      y: -20,
      r: rand(15, 30),
      vy: rand(1, 3),
    });
  };
  const spawnPackage = () => {
    packages.push({
      x: rand(20, W - 20),
      y: -20,
      r: 8,
      vy: 2,
    });
  };
  const spawnFuel = () => {
    fuels.push({
      x: rand(20, W - 20),
      y: -20,
      r: 6,
      vy: 2,
    });
  };

  // ----- input -----
  const resumeAudio = () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
  };
  window.addEventListener('keydown', e => {
    resumeAudio();
    keys[e.code] = true;
    if (e.code === 'ArrowUp') startBoostSound();
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') stopBoostSound();
  });

  // ----- main loop -----
  const update = dt => {
    if (gameOver) return;
    // fuel consumption
    ship.fuel -= 0.02 * dt;
    if (ship.fuel <= 0) ship.fuel = 0;

    // horizontal control
    if (keys['ArrowLeft']) ship.vx -= 0.05 * dt;
    if (keys['ArrowRight']) ship.vx += 0.05 * dt;
    // boost upward
    ship.boost = keys['ArrowUp'];
    if (ship.boost) {
      ship.vy -= 0.02 * dt;
      ship.fuel = Math.max(0, ship.fuel - 0.05 * dt);
    }

    // apply drag and limits
    ship.vx *= 0.99;
    ship.vy = Math.max(-5, ship.vy * 0.995);
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // keep ship inside canvas horizontally
    if (ship.x < 0) ship.x = W;
    if (ship.x > W) ship.x = 0;
    if (ship.y < 0) ship.y = 0;
    if (ship.y > H) ship.y = H;

    // spawn entities
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnPackage();
    if (Math.random() < 0.003) spawnFuel();

    // move entities
    const move = (arr, dt) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const o = arr[i];
        o.y += o.vy * dt;
        if (o.y - o.r > H) arr.splice(i, 1);
      }
    };
    move(asteroids, dt);
    move(packages, dt);
    move(fuels, dt);

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (dist(ship, a) < ship.radius + a.r) {
        playBeep(300, 0.4); // collision
        gameOver = true;
        break;
      }
    }
    for (let i = packages.length - 1; i >= 0; i--) {
      const p = packages[i];
      if (dist(ship, p) < ship.radius + p.r) {
        score++;
        packages.splice(i, 1);
        playBeep(800, 0.05); // package pickup
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (dist(ship, f) < ship.radius + f.r) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        fuels.splice(i, 1);
        playBeep(600, 0.07); // fuel cell pickup
      }
    }
  };

  const draw = () => {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#02021a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // stars with twinkling effect
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const sx = rand(0, W);
      const sy = rand(0, H);
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.5 + 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalAlpha = 1;

    // ship – triangle pointing direction based on velocity
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const angle = Math.atan2(ship.vy, ship.vx) + Math.PI / 2;
    ctx.rotate(angle);
    const shipGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, ship.radius);
    shipGrad.addColorStop(0, '#66ff66');
    shipGrad.addColorStop(1, '#009900');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.8, ship.radius);
    ctx.lineTo(-ship.radius * 0.8, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids – shaded circles
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // packages – bright squares
    ctx.fillStyle = '#ff0';
    packages.forEach(p => {
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });

    // fuel cells – glowing circles
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#006666');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  let last = performance.now();
  const loop = now => {
    const dt = (now - last) / 16; // normalize to ~60fps units
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // restart on canvas click after game over
  canvas.addEventListener('click', () => {
    if (!gameOver) return;
    // reset state
    ship.x = W / 2; ship.y = H - 80; ship.vx = 0; ship.vy = -1.5; ship.fuel = 100; ship.boost = false;
    asteroids.length = packages.length = fuels.length = 0;
    score = 0; gameOver = false;
  });
})();
