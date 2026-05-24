// Minimal Orbit Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // generate simple starfield background
  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
  }));

  const planet = { x: W / 2, y: H / 2, r: 30 };

  const player = {
    angle: 0,
    radius: planet.r + 50,
    size: 8,
    speed: 0.03, // angular speed per frame
    thrust: 0.5, // radial speed per frame when thrusting
    minOrbit: planet.r + 20,
    maxOrbit: Math.min(W, H) / 2 - 20,
  };

  const asteroids = [];
  const powerUps = [];
  let gameOver = false;
  let score = 0;

  // Utility
  const rand = (a, b) => Math.random() * (b - a) + a;

  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4)); // 0:top 1:right 2:bottom 3:left
    let x, y, vx, vy;
    const speed = rand(1, 3);
    if (side === 0) { x = rand(0, W); y = -20; vx = rand(-1, 1); vy = speed; }
    else if (side === 1) { x = W + 20; y = rand(0, H); vx = -speed; vy = rand(-1, 1); }
    else if (side === 2) { x = rand(0, W); y = H + 20; vx = rand(-1, 1); vy = -speed; }
    else { x = -20; y = rand(0, H); vx = speed; vy = rand(-1, 1); }
    const r = rand(5, 12);
    asteroids.push({ x, y, vx, vy, r });
  }

  function spawnPowerUp() {
    const angle = rand(0, Math.PI * 2);
    const radius = rand(player.minOrbit + 30, player.maxOrbit - 30);
    const x = planet.x + Math.cos(angle) * radius;
    const y = planet.y + Math.sin(angle) * radius;
    powerUps.push({ x, y, r: 6, collected: false });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update() {
    if (gameOver) return;
    // player controls
    if (keys['ArrowLeft']) player.angle -= player.speed;
    if (keys['ArrowRight']) player.angle += player.speed;
    if (keys['ArrowUp']) {
      player.radius = Math.min(player.radius + player.thrust, player.maxOrbit);
      playTone(300, 0.05); // thrust sound
    }
    // simple gravity pull towards planet if not thrusting
    player.radius = Math.max(player.radius - 0.1, player.minOrbit);

    // move asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -50 || a.x > W + 50 || a.y < -50 || a.y > H + 50) asteroids.splice(i, 1);
    }
    // collision detection
    const px = planet.x + Math.cos(player.angle) * player.radius;
    const py = planet.y + Math.sin(player.angle) * player.radius;
    // planet collision
    if (player.radius - player.size <= planet.r) {
      gameOver = true;
      playTone(100, 0.3); // crash sound
    }
    // asteroid collisions
    for (const a of asteroids) {
      const dx = px - a.x, dy = py - a.y;
      if (Math.hypot(dx, dy) < a.r + player.size) {
        gameOver = true;
        playTone(100, 0.3);
        break;
      }
    }
    // power‑up collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const d = Math.hypot(px - p.x, py - p.y);
      if (d < p.r + player.size) {
        player.minOrbit += 5; // expand safe orbit radius
        player.maxOrbit = Math.min(player.maxOrbit + 5, Math.min(W, H) / 2 - 20);
        powerUps.splice(i, 1);
        score += 10;
      }
    }
    // spawn logic
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnPowerUp();
    score += 0.01;
  }

  function draw() {
    // dark space background
    ctx.fillStyle = '#02010a';
    ctx.fillRect(0, 0, W, H);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x, planet.y, planet.r * 0.2,
      planet.x, planet.y, planet.r
    );
    planetGrad.addColorStop(0, '#666');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // player ship as triangle with slight shadow
    const px = planet.x + Math.cos(player.angle) * player.radius;
    const py = planet.y + Math.sin(player.angle) * player.radius;
    const shipAngle = player.angle + Math.PI / 2; // point outward
    const shipSize = player.size * 2;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(
      px + Math.cos(shipAngle) * shipSize,
      py + Math.sin(shipAngle) * shipSize
    );
    ctx.lineTo(
      px + Math.cos(shipAngle + Math.PI * 2 / 3) * shipSize * 0.6,
      py + Math.sin(shipAngle + Math.PI * 2 / 3) * shipSize * 0.6
    );
    ctx.lineTo(
      px + Math.cos(shipAngle - Math.PI * 2 / 3) * shipSize * 0.6,
      py + Math.sin(shipAngle - Math.PI * 2 / 3) * shipSize * 0.6
    );
    ctx.closePath();
    ctx.fill();
    // asteroids with subtle gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.r * 0.3,
        a.x, a.y, a.r
      );
      grad.addColorStop(0, '#c44');
      grad.addColorStop(1, '#822');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // power‑ups with glow
    for (const p of powerUps) {
      const grad = ctx.createRadialGradient(
        p.x, p.y, p.r * 0.2,
        p.x, p.y, p.r * 2
      );
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }
    // power‑ups
    ctx.fillStyle = '#ff0';
    for (const p of powerUps) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // start
  loop();
})();
