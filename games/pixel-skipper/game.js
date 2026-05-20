// Simple canvas dodge game
// Canvas element with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set a reasonable size if not defined in HTML/CSS
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  const ship = { x: canvas.width / 2 - 15, y: canvas.height - 50, w: 30, h: 30 };
  let asteroids = [];
  let score = 0;
  let gameOver = false;
  const keys = {};

  const spawnAsteroid = () => {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
    });
  };

  const update = (dt) => {
    // Ship movement (left/right arrows)
    if (keys['ArrowLeft']) ship.x -= 300 * dt;
    if (keys['ArrowRight']) ship.x += 300 * dt;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // Update asteroids
    for (const a of asteroids) a.y += a.speed;
    // Remove off‑screen asteroids
    asteroids = asteroids.filter((a) => a.y < canvas.height);
    // Randomly spawn new ones
    if (Math.random() < 0.02) spawnAsteroid();

    // Collision detection
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y < a.y + a.h &&
        ship.y + ship.h > a.y
      ) {
        gameOver = true;
        // Play collision sound
        playTone(200, 0.2);
        break;
      }
    }
    if (!gameOver) score += dt;
  };

  const draw = () => {
    // Background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const sr = Math.random() * 2 + 1;
      ctx.fillRect(sx, sy, sr, sr);
    }
    // Draw ship as triangle
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids as circles
    ctx.fillStyle = '#777777';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  };

  // Input with sound feedback
  window.addEventListener('keydown', (e) => {
    if (!keys[e.key]) {
      // Play a short tone for movement
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playTone(400, 0.05);
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  requestAnimationFrame(loop);
})();
