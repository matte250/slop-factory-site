// Cosmic Dodge with improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);
  // Starfield background
  // Sound effects
  const moveSound = new Audio('https://cdn.jsdelivr.net/gh/jaames/JSFX/sfx/laser12.ogg');
  const crashSound = new Audio('https://cdn.jsdelivr.net/gh/jaames/JSFX/sfx/explosion.wav');
  let lastMovePlay = 0;
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.5,
    });
  }

  // Player ship
  const ship = { x: W / 2, y: H * 0.8, r: 10, speed: 3 };
  // Ship trail (last positions for fade effect)
  const shipTrail = []; // will store {x,y}
  const maxTrail = 12;

  // Asteroids
  const asteroids = [];
  const asteroidFreq = 60; // frames
  let frame = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Scoring
  let start = performance.now();
  let highScore = parseFloat(localStorage.getItem('cosmicHigh') || '0');

  function spawnAsteroid() {
    const size = Math.random() * 15 + 5;
    const x = Math.random() * (W - size * 2) + size;
    const y = -size;
    const speed = Math.random() * 1.5 + 1 + frame / 2000; // gradually faster
    asteroids.push({ x, y, r: size, speed });
  }

  function update() {
    // Move ship
    let moved = false;
    if (keys.ArrowLeft || keys.a) { ship.x -= ship.speed; moved = true; }
    if (keys.ArrowRight || keys.d) { ship.x += ship.speed; moved = true; }
    if (keys.ArrowUp || keys.w) { ship.y -= ship.speed; moved = true; }
    if (keys.ArrowDown || keys.s) { ship.y += ship.speed; moved = true; }
    // Play move sound (throttled)
    const nowTime = performance.now();
    if (moved && nowTime - lastMovePlay > 100) { moveSound.currentTime = 0; moveSound.play(); lastMovePlay = nowTime; }
    // Keep inside canvas
    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y));

    // Spawn asteroids
    if (frame % asteroidFreq === 0) spawnAsteroid();
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.r) gameOver();
    }

    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship trail (fading)
    shipTrail.push({ x: ship.x, y: ship.y });
    if (shipTrail.length > maxTrail) shipTrail.shift();
    ctx.fillStyle = 'rgba(0,255,0,0.3)';
    for (let i = 0; i < shipTrail.length; i++) {
      const p = shipTrail[i];
      const alpha = (i + 1) / shipTrail.length;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ship.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,0,${alpha * 0.3})`;
      ctx.fill();
    }
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // Asteroids (irregular)
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 * i) / points;
        const rad = a.r * (0.7 + Math.random() * 0.6);
        const px = a.x + Math.cos(angle) * rad;
        const py = a.y + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Score
    const now = performance.now();
    const score = ((now - start) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    ctx.fillText(`High: ${highScore.toFixed(1)}s`, 10, 40);

    frame++;
    if (!gameEnded) requestAnimationFrame(update);
  }

  let gameEnded = false;
  function gameOver() {
    gameEnded = true;
    // Play crash sound
    crashSound.currentTime = 0;
    crashSound.play();
    const now = performance.now();
    const score = (now - start) / 1000;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('cosmicHigh', highScore);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f00';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2 - 20);
    ctx.fillText(`${score.toFixed(1)} seconds`, W / 2, H / 2 + 20);
  }

  // Start loop
  update();
})();
