// Asteroid Escape – minimal canvas game
// Targets <canvas id="game"></canvas> assumed present in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let bgMusicStarted = false;
  let bgOscillator, bgGain;
  const startBackgroundMusic = () => {
    if (bgOscillator) return;
    bgOscillator = audioCtx.createOscillator();
    bgGain = audioCtx.createGain();
    bgOscillator.frequency.value = 30; // low hum
    bgGain.gain.value = 0.02;
    bgOscillator.connect(bgGain).connect(audioCtx.destination);
    bgOscillator.start();
    bgMusicStarted = true;
  };
  const playCollision = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  const resize = () => {
    canvas.width = canvas.clientWidth * DPR;
    canvas.height = canvas.clientHeight * DPR;
    ctx.scale(DPR, DPR);
    // initialize stars for background if empty
    if (stars.length === 0) {
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 0.5,
          size: 1 + Math.random() * 2,
          brightness: 150 + Math.random() * 105,
        });
      }
    }
    // start background ambience if not already
    if (!bgMusicStarted) startBackgroundMusic();
  };
  resize();
  window.addEventListener('resize', resize);

  // ---- Game state ----
  const ship = { x: canvas.width / 2, y: canvas.height - 60, w: 30, h: 40, speed: 4 };
  const keys = {};
  const stars = [];
  const asteroids = [];
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  // ---- Input ----
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = (e.clientX - rect.left) * DPR;
  });

  const spawnAsteroid = () => {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x, y, size, speed });
  };

  const update = dt => {
    if (gameOver) return;
    // ship movement (arrow keys fallback)
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // spawn asteroids
    if (performance.now() - lastSpawn > 800) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision
      if (
        a.x < ship.x + ship.w && a.x + a.size > ship.x &&
        a.y < ship.y + ship.h && a.y + a.size > ship.y
      ) {
        playCollision();
        gameOver = true;
      }
      // remove off‑screen
      if (a.y > canvas.height) asteroids.splice(i, 1);
    }

    // update stars (slow drift for parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    score += dt;
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // starfield background (gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d'); // deep space top
    bgGrad.addColorStop(1, '#000000'); // black bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars with individual brightness and size
    stars.forEach(s => {
      ctx.fillStyle = `rgb(${s.brightness},${s.brightness},${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.h);
    shipGrad.addColorStop(0, '#4caf50');
    shipGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // optional outline
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1;
    ctx.stroke();
    // asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score / game over text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score / 1000)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = now => {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
