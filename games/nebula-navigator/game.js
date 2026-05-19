// Minimal Nebula Navigator game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context runs after first user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  function beep(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration + 0.02);
  }

  function playCollect() { beep(800, 0.07); }
  function playCollision() { beep(200, 0.3); }
  function playGameOver() { beep(100, 0.5); }

  // ----- Game objects -----
  const ship = { x: canvas.width / 2, y: canvas.height - 50, size: 20, speed: 4 };
  const stars = [];
  const nebulas = [];
  const asteroids = [];
  // each asteroid will have rotation angle for visual variety

  let fuel = 100; // percentage
  let score = 0;
  let gameOver = false;
  let gameOverSoundPlayed = false;
  const keys = {};

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnStars(count) {
    for (let i = 0; i < count; i++) {
      stars.push({ x: rand(0, canvas.width), y: rand(0, canvas.height), r: rand(0.5, 2), alpha: rand(0.5, 1) });
    }
  }
  function spawnNebula() {
    nebulas.push({ x: rand(0, canvas.width), y: -20, r: 8, collected: false });
  }
  function spawnAsteroid() {
    asteroids.push({
      x: rand(0, canvas.width),
      y: -30,
      r: 12,
      speed: rand(1, 3),
      angle: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.03, 0.03)
    });
  }

  // ----- Init -----
  spawnStars(100);
  setInterval(() => { if (!gameOver) spawnNebula(); }, 2000);
  setInterval(() => { if (!gameOver) spawnAsteroid(); }, 1500);

  // ----- Input -----
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Main loop -----
  function update() {
    if (gameOver) return;

    // Move ship
    if (keys['ArrowLeft'] && ship.x - ship.size > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.size < canvas.width) ship.x += ship.speed;
    if (keys['ArrowUp'] && ship.y - ship.size > 0) ship.y -= ship.speed;
    if (keys['ArrowDown'] && ship.y + ship.size < canvas.height) ship.y += ship.speed;

    // Fuel consumption
    fuel -= 0.03;
    if (fuel <= 0) {
        fuel = 0;
        if (!gameOverSoundPlayed) {
          playGameOver();
          gameOverSoundPlayed = true;
        }
        gameOver = true;
      }

    // Update stars (scroll down)
    for (const s of stars) {
      s.y += 0.5;
      if (s.y > canvas.height) s.y = 0;
    }

    // Update nebulas
    for (const n of nebulas) {
      n.y += 1.5;
    }
    // Collect nebula fragments
    for (const n of nebulas) {
      if (!n.collected && Math.hypot(ship.x - n.x, ship.y - n.y) < ship.size + n.r) {
        n.collected = true;
        score += 10;
        fuel = Math.min(100, fuel + 5);
        playCollect();
      }
    }
    // Remove off‑screen or collected nebulas
    nebulas.splice(0, nebulas.filter(n => n.y > canvas.height || n.collected).length);

    // Update asteroids (movement and rotation)
    for (const a of asteroids) {
      a.y += a.speed;
      a.angle += a.rotSpeed;
    }
    // Collision with asteroids ends game
    for (const a of asteroids) {
      if (Math.hypot(ship.x - a.x, ship.y - a.y) < ship.size + a.r) {
        if (!gameOverSoundPlayed) {
          playCollision();
          // playGameOver will be handled by the same flag logic in the game over overlay
          gameOverSoundPlayed = true;
        }
        gameOver = true;
      }
    }
    // Remove off‑screen asteroids
    asteroids.splice(0, asteroids.filter(a => a.y > canvas.height).length);
  }

  function draw() {
    // Space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars with twinkling alpha
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.globalAlpha = 1; // reset

    // Nebulas (glowing)
    for (const n of nebulas) {
      if (n.collected) continue;
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, 'rgba(0,255,255,0.8)');
      grad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Asteroids with rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = '#888';
      ctx.beginPath();
      // simple 5‑point polygon
      // draw irregular pentagon
      for (let i = 0; i < 5; i++) {
        const theta = (i * 2 * Math.PI) / 5;
        const radius = a.r * (0.8 + Math.random() * 0.4);
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Ship (triangle with slight gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.size, ship.x, ship.y + ship.size);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
    if (gameOver) {
      // Play game over sound once
      if (!gameOverSoundPlayed) {
        playGameOver();
        gameOverSoundPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
