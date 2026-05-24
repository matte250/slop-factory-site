// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Unlock audio on first user interaction
  const unlockAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  document.addEventListener('keydown', unlockAudio, { once: true });

  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Simple sound wrappers
  function playThrust() { playTone(400); }
  function playExplosion() { playTone(80, 0.3); }
  function playGameOver() { playTone(200, 0.5); }


  // Ship
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 40,
    speed: 4,
    dx: 0,
    dy: 0,
    color: '#0ff',
  };

  // Game state
  let asteroids = [];
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, speed: 0.5 + Math.random() * 0.5, size: Math.random() * 2 + 1 });
  }
  let fuel = 100; // percent
  let score = 0;
  let lastAsteroid = 0;
  let gameOver = false;
  const keys = {};

  // Input handling
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
  });
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const y = -size;
    const speed = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    asteroids.push({ x: Math.random() * (width - size), y, size, speed, angle, rot: 0 });
  }

  function update(dt) {
    if (gameOver) return;
    // ship movement
    ship.dx = ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // fuel consumption
    fuel -= dt * 0.02; // consume over time
    if (fuel <= 0) endGame();

    // spawn asteroids every 1s
    if (performance.now() - lastAsteroid > 1000) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.rot += 0.05;
      if (a.y - a.size > height) {
        asteroids.splice(i, 1);
        score++;
      } else if (checkCollision(ship, a)) {
        playExplosion();
        endGame();
      }
    }
  }

  function checkCollision(s, a) {
    // simple circle-rect collision
    const cx = a.x + a.size / 2;
    const cy = a.y + a.size / 2;
    const rx = s.x, ry = s.y, rw = s.w, rh = s.h;
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < (a.size / 2) * (a.size / 2);
  }

  function endGame() {
    playGameOver();
    gameOver = true;
  }

  function draw() {
    // draw starfield with gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#888'; // star color
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // ship (triangle) with glow
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = ship.color;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.h + ship.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // thrust particles when moving up
        if (keys['ArrowUp']) {
      ctx.fillStyle = '#ff0';
      for (let i = 0; i < 3; i++) {
        const tx = ship.x + ship.w / 2 + (Math.random() - 0.5) * 10;
        const ty = ship.y + ship.h + Math.random() * 10;
        ctx.fillRect(tx, ty, 2, 6);
      }
      playThrust();
    }

    // asteroids with gradient shading
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.rot);
      const grad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, fuel).toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 40);
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
