// Simple Asteroid Salvage game targeting <canvas id="game"></canvas>
(function(){
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(600);
  const playCrash = () => playTone(150);
  const playGameOver = () => playTone(80, 0.5);
  // Ensure audio resumes on first user interaction
  const resumeAudio = () => { audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });
  // Original game code starts below
})
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // --- Game state -----------------------------------------------------------
  const ship = { x: W / 2, y: H - 50, w: 30, h: 30, speed: 4 };
  const keys = {};
  const asteroids = [];
  const debris = [];
  let fuel = 100; // percent
  let score = 0;
  let gameOver = false;

  // --- Helpers --------------------------------------------------------------
  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const spawnAsteroid = () => {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      vy: 1 + Math.random() * 2,
    });
  };

  const spawnDebris = () => {
    const size = 10 + Math.random() * 10;
    debris.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      vy: 1 + Math.random() * 1.5,
    });
  };

  // --- Input ---------------------------------------------------------------
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // --- Main loop ------------------------------------------------------------
  const update = () => {
    if (gameOver) return;
    // move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // spawn entities
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.015) spawnDebris();

    // move asteroids
    asteroids.forEach((a) => (a.y += a.vy));
    debris.forEach((d) => (d.y += d.vy));

    // remove off‑screen
    const off = (obj) => obj.y > H;
    while (asteroids.length && off(asteroids[0])) asteroids.shift();
    while (debris.length && off(debris[0])) debris.shift();

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (rectCollide(ship, asteroids[i])) {
        gameOver = true;
        playCrash();
        playGameOver();
        break;
      }
    }
    for (let i = debris.length - 1; i >= 0; i--) {
      if (rectCollide(ship, debris[i])) {
        score += 10;
        fuel = Math.min(100, fuel + 5);
        debris.splice(i, 1);
        playCollect();
      }
    }

    // fuel consumption
    fuel -= 0.05;
    if (fuel <= 0) {
      gameOver = true;
      playGameOver();
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    // background stars
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(sx, sy, 1, 1);
    }
    // ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (gray circles with gradient)
    asteroids.forEach((a) => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 4,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // debris (small glowing circles)
    ctx.fillStyle = '#3a3';
    debris.forEach((d) => {
      const grad = ctx.createRadialGradient(
        d.x + d.w / 2,
        d.y + d.h / 2,
        d.w / 4,
        d.x + d.w / 2,
        d.y + d.h / 2,
        d.w / 2
      );
      grad.addColorStop(0, '#6f6');
      grad.addColorStop(1, '#2a2');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  loop();
})();
