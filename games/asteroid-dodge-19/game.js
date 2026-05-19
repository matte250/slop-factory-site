// Simple “Asteroid Dodge” game – targets <canvas id="game">

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // ----- Sounds ------------------------------------------------------------
  // simple beep sounds using data URIs (short .wav files)
  const thrustSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='); // silent placeholder
  const explodeSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');
  const pickupSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');

  // Fit canvas to its CSS size (or full window)
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // ----- Game state ---------------------------------------------------------
  const player = { w: 30, h: 40, x: 0, y: 0, speed: 4 };
  const stars = [];          // background stars
  const asteroids = [];      // obstacles
  const fuels = [];          // fuel cells
  let fuel = 100;            // fuel gauge (0–100)
  let left = false, right = false;
  let frame = 0, gameOver = false;

  // ----- Helpers -------------------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;

  // ----- Input ---------------------------------------------------------------
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  });

  // ----- Entities creation ----------------------------------------------------
  const spawnStar = () => stars.push({ x: rand(0, canvas.width), y: 0, r: rand(0.5, 2), s: rand(0.2, 0.6) });
  const spawnAsteroid = () => asteroids.push({
    x: rand(0, canvas.width - 30), y: -30,
    w: 30, h: 30, s: rand(2, 4)
  });
  const spawnFuel = () => fuels.push({
    x: rand(0, canvas.width - 20), y: -20,
    w: 20, h: 20, s: 2
  });

  // ----- Collision -----------------------------------------------------------
  const intersect = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ----- Main loop -----------------------------------------------------------
  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }

    // ---- Update ------------------------------------------------------------
    frame++;

    // background stars
    if (frame % 2 === 0) spawnStar();
    stars.forEach(s => s.y += s.s);
    while (stars.length && stars[0].y > canvas.height) stars.shift();

    // player movement
    player.x = Math.max(0, Math.min(canvas.width - player.w,
      player.x + (left ? -player.speed : 0) + (right ? player.speed : 0)));
    // thrust sound while moving
    if (left || right) {
      if (thrustSound.paused) {
        thrustSound.currentTime = 0;
        thrustSound.play();
      }
    } else {
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }

    // fuel consumption
    fuel = Math.max(0, fuel - 0.02);
    if (fuel <= 0) gameOver = true;

    // asteroids
    if (frame % 60 === 0) spawnAsteroid();
    asteroids.forEach(a => a.y += a.s);
    while (asteroids.length && asteroids[0].y > canvas.height) asteroids.shift();

    // fuel cells
    if (frame % 300 === 0) spawnFuel();
    fuels.forEach(f => f.y += f.s);
    while (fuels.length && fuels[0].y > canvas.height) fuels.shift();

    // collision checks
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (intersect(player, asteroids[i])) { explodeSound.currentTime = 0; explodeSound.play(); gameOver = true; break; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (intersect(player, fuels[i])) {
        fuel = Math.min(100, fuel + 30);
        fuels.splice(i, 1);
        // play pickup sound
        pickupSound.currentTime = 0;
        pickupSound.play();
      }
    }

    // ---- Render -----------------------------------------------------------
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d'); // deep space blue
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // player ship (simple triangle)
    // ship with gradient and thruster
    const shipGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // thruster flame when moving
    if (left || right) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(player.x + player.w / 2, player.y + player.h);
      ctx.lineTo(player.x + player.w / 2 - 5, player.y + player.h + 10);
      ctx.lineTo(player.x + player.w / 2 + 5, player.y + player.h + 10);
      ctx.closePath();
      ctx.fill();
    }

    // asteroids
    ctx.fillStyle = '#a00';
    asteroids.forEach(a => ctx.fillRect(a.x, a.y, a.w, a.h));

    // fuel cells
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => ctx.fillRect(f.x, f.y, f.w, f.h));

    // fuel gauge
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(fuel)}%`, 10, 20);

    requestAnimationFrame(loop);
  };

  // Initialise player position & start loop
  player.x = (canvas.width - player.w) / 2;
  player.y = canvas.height - player.h - 10;
  requestAnimationFrame(loop);
})();
