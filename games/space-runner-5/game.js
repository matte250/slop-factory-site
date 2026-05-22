// Enhanced graphics with sound for a canvas with id="game"
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 400;

  // ----- Game objects -----
  const ship = { x: 50, y: canvas.height / 2, w: 20, h: 20 };
  let asteroids = [];
  let stars = [];
  const STAR_COUNT = 80;
  const initStars = () => {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  };
  initStars();

  let lastSpawn = 0;
  let gameOver = false;

  // ----- Input -----
  const mouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top - ship.h / 2;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // subtle movement sound
    playBeep(800, 0.02);
  };
  const keyMove = (e) => {
    const step = 5;
    if (e.key === 'ArrowUp') ship.y = Math.max(0, ship.y - step);
    else if (e.key === 'ArrowDown') ship.y = Math.min(canvas.height - ship.h, ship.y + step);
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // movement beep
    playBeep(600, 0.03);
  };
  canvas.addEventListener('mousemove', mouseMove);
  window.addEventListener('keydown', keyMove);

  // ----- Asteroid spawning -----
  const spawnAsteroid = () => {
    const radius = 10 + Math.random() * 15;
    const y = Math.random() * (canvas.height - radius * 2) + radius;
    asteroids.push({ x: canvas.width + radius, y, r: radius, speed: 3 + Math.random() * 2 });
  };

  const checkCollision = (a) => {
    return (
      a.x - a.r < ship.x + ship.w &&
      a.x + a.r > ship.x &&
      a.y - a.r < ship.y + ship.h &&
      a.y + a.r > ship.y
    );
  };

  // ----- Drawing -----
  const drawBackground = () => {
    // Space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars (move slowly left for parallax)
    ctx.fillStyle = '#fff';
    stars.forEach((s) => {
      s.x -= 0.3; // slow drift
      if (s.x < 0) s.x = canvas.width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawShip = () => {
    ctx.save();
    ctx.translate(ship.x, ship.y + ship.h / 2);
    // Ship as a simple triangle with gradient
    const shipGrad = ctx.createLinearGradient(0, -ship.h / 2, 0, ship.h / 2);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00f');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.w, 0);
    ctx.lineTo(0, -ship.h / 2);
    ctx.lineTo(0, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawAsteroid = (a) => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#444');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (timestamp) => {
    if (gameOver) return;
    if (!lastSpawn) lastSpawn = timestamp;
    const delta = timestamp - lastSpawn;
    if (delta > 1500) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    drawBackground();
    drawShip();

    // Update and render asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      drawAsteroid(a);

      if (checkCollision(a)) {
        gameOver = true;
        // collision sound
        playBeep(200, 0.4);
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        return;
      }
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
})();
