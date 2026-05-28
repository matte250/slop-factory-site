// Meteor Dodge game
// Canvas with id='game'
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas
  const ctx = canvas.getContext('2d');
  // sound effects
  const sounds = {
    boost: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='), // placeholder beep
    hit: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
    shield: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
    gameover: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
  };
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Ship (triangle shape)
  const ship = { x: width / 2, y: height - 30, w: 30, h: 20, speed: 4, vy: 0, boost: false };
  // meteors array
  const meteors = [];
  // generate background stars
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  // power‑ups (shield) – simple boolean
  let shield = false;
  let shieldTimer = 0;
  // score (seconds survived)
  let startTime = performance.now();
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === 'ArrowUp') { ship.boost = true; sounds.boost.currentTime = 0; sounds.boost.play(); } });
  window.addEventListener('keyup', e => { keys[e.key] = false; if (e.key === 'ArrowUp') ship.boost = false; });

  function spawnMeteor() {
    const size = 20 + Math.random() * 20;
    const x = Math.random() * (width - size);
    const y = -size;
    const speedY = 1 + Math.random() * 2 + meteors.length * 0.02; // slowly increase
    const speedX = (Math.random() - 0.5) * 1.5;
    meteors.push({ x, y, w: size, h: size, vx: speedX, vy: speedY });
  }

  function spawnShield() {
    const size = 20;
    const x = Math.random() * (width - size);
    const y = -size;
    const speedY = 1;
    meteors.push({ x, y, w: size, h: size, vx: 0, vy: speedY, shield: true });
  }

  let meteorTimer = 0;
  let shieldTimerSpawn = 0;

  function update(dt) {
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    // boost upward briefly
    if (ship.boost) ship.vy = -2; else ship.vy = 0;
    ship.y += ship.vy;
    // keep ship within vertical bounds
    if (ship.y < 0) ship.y = 0;
    if (ship.y > height - ship.h) ship.y = height - ship.h;

    // spawn meteors
    meteorTimer += dt;
    if (meteorTimer > 800) { // every 0.8s
      spawnMeteor();
      meteorTimer = 0;
    }
    // occasional shield power‑up
    shieldTimerSpawn += dt;
    if (shieldTimerSpawn > 5000) { // every 5s
      // 20% chance
      if (Math.random() < 0.2) spawnShield();
      shieldTimerSpawn = 0;
    }

    // update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      // remove off‑screen
      if (m.y > height) meteors.splice(i, 1);
    }

    // collision detection
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const coll = !(ship.x > m.x + m.w || ship.x + ship.w < m.x || ship.y > m.y + m.h || ship.y + ship.h < m.y);
      if (coll) {
        if (m.shield) {
          shield = true;
          shieldTimer = 3000; // 3 seconds
          meteors.splice(i, 1);
          sounds.shield.currentTime = 0;
          sounds.shield.play();
        } else if (shield) {
          // absorb hit
          shield = false;
          meteors.splice(i, 1);
          sounds.hit.currentTime = 0;
          sounds.hit.play();
        } else {
          gameOver = true;
          sounds.gameover.currentTime = 0;
          sounds.gameover.play();
        }
      }
    }
    if (shield) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) shield = false;
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // ship (triangle)
    ctx.fillStyle = shield ? 'cyan' : 'white';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // meteors with gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, m.w / 4, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
      if (m.shield) {
        grad.addColorStop(0, 'gold');
        grad.addColorStop(1, '#555');
      } else {
        grad.addColorStop(0, '#888');
        grad.addColorStop(1, '#222');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = 'lime';
    ctx.font = '16px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${seconds}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
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
  }
  requestAnimationFrame(loop);
})();
