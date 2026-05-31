// Minimal Orbit Defender game
// Canvas with id="game" expected in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill its container and recalc derived values
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // update centre and spawn distance on resize
    center.x = canvas.width / 2;
    center.y = canvas.height / 2;
    asteroidSpawnDist = Math.max(canvas.width, canvas.height) / 2 + 20;
  };
  window.addEventListener('resize', resize);
  resize();

  let center = { x: canvas.width / 2, y: canvas.height / 2 };
  let asteroidSpawnDist = Math.max(canvas.width, canvas.height) / 2 + 20;

  const planetRadius = 30;
  const shipOrbit = 80;
  const shipRadius = 8;
  const bulletSpeed = 4;
  const asteroidSpeed = 1.2;
  const asteroidSpawnDist = Math.max(canvas.width, canvas.height) / 2 + 20;

  let shipAngle = 0; // radians
  let leftDown = false,
    rightDown = false,
    firePressed = false;
  const bullets = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // Input handling and audio init
  let audioCtx;
  const ensureAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const playTone = (freq, duration = 0.1) => {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };

  const playShoot = () => playTone(400);
  const playExplosion = () => playTone(150);
  const playGameOver = () => playTone(80);

  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') leftDown = true;
    if (e.code === 'ArrowRight') rightDown = true;
    if (e.code === 'Space') firePressed = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') leftDown = false;
    if (e.code === 'ArrowRight') rightDown = false;
    if (e.code === 'Space') firePressed = false;
  });

  // Starfield for background
  const stars = [];
  const generateStars = (count = 100) => {
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
      });
    }
  };
  generateStars();

  const spawnAsteroid = () => {
    const angle = Math.random() * Math.PI * 2;
    const x = center.x + Math.cos(angle) * asteroidSpawnDist;
    const y = center.y + Math.sin(angle) * asteroidSpawnDist;
    const vx = (center.x - x) / Math.hypot(center.x - x, center.y - y) * asteroidSpeed;
    const vy = (center.y - y) / Math.hypot(center.x - x, center.y - y) * asteroidSpeed;
    asteroids.push({ x, y, vx, vy, r: 12 });
  };

  // Game loop
  const update = () => {
    if (gameOver) return;
    // ship rotation
    if (leftDown) shipAngle -= 0.04;
    if (rightDown) shipAngle += 0.04;

    // fire bullet
    if (firePressed) {
      // simple rate limit
      if (!bullets.length || bullets[bullets.length - 1].age > 10) {
        const sx = center.x + Math.cos(shipAngle) * shipOrbit;
        const sy = center.y + Math.sin(shipAngle) * shipOrbit;
        const vx = Math.cos(shipAngle) * bulletSpeed;
        const vy = Math.sin(shipAngle) * bulletSpeed;
        bullets.push({ x: sx, y: sy, vx, vy, r: 3, age: 0 });
        playShoot();
      }
    }

    // update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.age++;
      // remove off‑screen
      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    }

    // spawn asteroids periodically
    if (Math.random() < 0.02) spawnAsteroid();

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // collide with planet?
      const dp = Math.hypot(a.x - center.x, a.y - center.y);
if (dp < planetRadius + a.r) {
          gameOver = true;
          playGameOver();
          break;
        }
      // collide with bullets?
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) {
          // destroy both
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          break;
        }
      }
    }
  };

  const render = () => {
    // background – dark space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#090720');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // planet – radial gradient for a glassy look
    const planetGrad = ctx.createRadialGradient(
      center.x,
      center.y,
      planetRadius * 0.2,
      center.x,
      center.y,
      planetRadius
    );
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    // ship – triangle pointing along its orbit direction (already defined earlier)
    // (drawn earlier in ship rendering block, unchanged here)

    // bullets – small white sparks
    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // asteroids – use radial gradient for a rocky look
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x,
        a.y,
        a.r * 0.3,
        a.x,
        a.y,
        a.r
      );
      grad.addColorStop(0, '#aa4444');
      grad.addColorStop(1, '#442222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // score / game over text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };


  const loop = () => {
    update();
    render();
    requestAnimationFrame(loop);
  };
  loop();
})();
