// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playSound(type) {
    switch(type) {
      case 'shoot': playBeep(800, 0.08); break;
      case 'explosion': playBeep(200, 0.15); break;
      case 'pickup': playBeep(400, 0.12); break;
      case 'gameover': playBeep(100, 0.4); break;
    }
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // ----- Game State -----
  const ship = { x: W / 2, y: H - 60, w: 40, h: 20, speed: 4, ammo: 10, fuel: 100 };
  const bullets = [];
  const asteroids = [];
  const fuels = [];
  let keys = {};
  let gameOver = false;
  let lastAsteroid = 0;
  let lastFuel = 0;

  // ----- Input -----
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (W - size), y: -size, w: size, h: size, speed: 1 + Math.random() * 2 });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({ x: Math.random() * (W - size), y: -size, w: size, h: size, speed: 1 });
  }

  // ----- Game Loop -----
  function update(dt) {
    if (gameOver) return;
    // ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // shooting
    if (keys['Space'] && ship.ammo > 0) {
      // simple rate limiting: one bullet per 200ms
      if (!ship.lastShot || Date.now() - ship.lastShot > 200) {
        bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10, speed: 6 });
        ship.ammo--;
        ship.lastShot = Date.now();
        playSound('shoot');
      }
    }

    // update bullets
    bullets.forEach(b => (b.y -= b.speed));
    // remove off-screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].y + bullets[i].h < 0) bullets.splice(i, 1);

    // spawn asteroids
    if (Date.now() - lastAsteroid > 1000) {
      spawnAsteroid();
      lastAsteroid = Date.now();
    }
    // spawn fuel pickups
    if (Date.now() - lastFuel > 5000) {
      spawnFuel();
      lastFuel = Date.now();
    }

    // update asteroids and check collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
          bullets.splice(j, 1);
          asteroids.splice(i, 1);
          playSound('explosion');
          break;
        }
      }
      // ship collision
if (!gameOver && ship.x < a.x + a.w && ship.x + ship.w > a.x && ship.y < a.y + a.h && ship.y + ship.h > a.y) {
          gameOver = true;
          playSound('gameover');
        }
      // remove off-screen
      if (a.y > H) asteroids.splice(i, 1);
    }

    // fuel pickups
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
if (ship.x < f.x + f.w && ship.x + ship.w > f.x && ship.y < f.y + f.h && ship.y + ship.h > f.y) {
          ship.fuel = Math.min(100, ship.fuel + 30);
          fuels.splice(i, 1);
          playSound('pickup');
          continue;
        }
      if (f.y > H) fuels.splice(i, 1);
    }

    // fuel consumption
    ship.fuel -= dt * 0.02; // drain over time
    if (ship.fuel <= 0) gameOver = true;
  }

// generate simple starfield background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5, twinkle: Math.random() });
}

function drawBackground() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  stars.forEach(st => {
    // simple twinkle effect
    const alpha = 0.5 + 0.5 * Math.sin(performance.now() / 1000 + st.twinkle * Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
    drawBackground();
    // ship - triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // bullets - small circles
    bullets.forEach(b => {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w, 0, Math.PI*2);
      ctx.fill();
    });
    // asteroids - circles with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // fuel pickups - glowing orbs
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x + f.w/2, f.y + f.h/2, f.w/4, f.x + f.w/2, f.y + f.h/2, f.w/2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#006');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.w/2, f.y + f.h/2, f.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Ammo: ${ship.ammo}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
    else setTimeout(() => location.reload(), 3000);
  }
  requestAnimationFrame(loop);
})();
