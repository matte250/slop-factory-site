// Game: Cosmic Courier
// Minimal top‑down canvas game. Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio assets
  const boostSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');
  const winSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');

  // Resize to fill window
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize);
  resize();

  // ----- Game objects -----
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    size: 20,
    speed: 2,
    vx: 0,
    vy: 0,
    fuel: 100,
  };

  const stars = [];
  for (let i = 0; i < 100; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1 });

  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastAsteroid = 0;

  const target = {
    x: Math.random() * canvas.width,
    y: 40,
    size: 30,
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);

  // ----- Helpers -----
  const rectCollide = (a, b) => a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;

  // ----- Main loop -----
  function update(dt) {
    // Player movement
    player.vx = 0; player.vy = 0;
    if (keys['ArrowLeft']) player.vx = -player.speed;
    if (keys['ArrowRight']) player.vx = player.speed;
    if (keys['ArrowUp']) player.vy = -player.speed;
    if (keys['ArrowDown']) player.vy = player.speed;
    if (keys['Space'] && player.fuel > 0) { // boost
      const boost = 2;
      player.vx *= boost; player.vy *= boost; player.fuel -= 0.1;
      boostSound.currentTime = 0; boostSound.play();
    }
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x + player.vx));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y + player.vy));

    // Stars scroll downward
    for (const s of stars) {
      s.y += 0.5;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    }

    // Asteroids
    if (performance.now() - lastAsteroid > asteroidSpawnInterval) {
      const size = Math.random() * 30 + 20;
      asteroids.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed: Math.random() * 1.5 + 0.5 });
      lastAsteroid = performance.now();
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > canvas.height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (rectCollide({x:player.x, y:player.y, size:player.size}, a)) {
        gameOver('Crashed into an asteroid');
        return;
      }
    }
    if (player.fuel <= 0) { gameOver('Ran out of fuel'); return; }
    if (rectCollide({x:player.x, y:player.y, size:player.size}, {x:target.x, y:target.y, size:target.size})) {
      win();
      return;
    }
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      // occasional tiny flicker
      const size = s.size * (Math.random() > 0.98 ? 2 : 1);
      ctx.fillRect(s.x, s.y, size, size);
    }

    // Target – draw as a small package icon
    ctx.save();
    ctx.translate(target.x + target.size/2, target.y + target.size/2);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(-target.size/2, -target.size/2, target.size, target.size);
    ctx.fillStyle = '#060';
    ctx.fillRect(-target.size/2 + 4, -target.size/2 + 4, target.size-8, target.size-8);
    ctx.restore();

    // Player ship – triangle with boost flame
    ctx.save();
    ctx.translate(player.x + player.size/2, player.y + player.size/2);
    const angle = Math.atan2(player.vy, player.vx);
    ctx.rotate(angle);
    // ship body
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.moveTo(0, -player.size/2);
    ctx.lineTo(-player.size/2, player.size/2);
    ctx.lineTo(player.size/2, player.size/2);
    ctx.closePath();
    ctx.fill();
    // boost flame when accelerating
    if (keys['Space'] && player.fuel > 0) {
      const grad = ctx.createRadialGradient(0, player.size/2, 2, 0, player.size/2, 12);
      grad.addColorStop(0, 'rgba(255,150,0,0.8)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, player.size/2);
      ctx.lineTo(-6, player.size/2 + 12);
      ctx.lineTo(6, player.size/2 + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Asteroids – shaded circles
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x + a.size/2, a.y + a.size/2);
      const radGrad = ctx.createRadialGradient(0, 0, a.size*0.2, 0, 0, a.size/2);
      radGrad.addColorStop(0, '#bbb');
      radGrad.addColorStop(1, '#555');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size/2, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // HUD – fuel bar
    const barWidth = 100;
    const barHeight = 10;
    const fuelPct = Math.max(0, player.fuel) / 100;
    ctx.fillStyle = '#444';
    ctx.fillRect(10, 10, barWidth, barHeight);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, barWidth * fuelPct, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Fuel`, 10, 28);
  }

  let lastTime = 0;
  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    draw();
    if (!gameEnded) requestAnimationFrame(loop);
  }

  // ----- End states -----
  let gameEnded = false;
  function gameOver(msg) {
    gameEnded = true;
    // play crash sound
    crashSound.currentTime = 0; crashSound.play();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2-20);
    ctx.fillText(msg, canvas.width/2, canvas.height/2+30);
  }
  function win() {
    gameEnded = true;
    // play win sound
    winSound.currentTime = 0; winSound.play();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Package Delivered!', canvas.width/2, canvas.height/2);
  }

  requestAnimationFrame(loop);
})();
