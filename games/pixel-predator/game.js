// Game based on IDEA.md – enhanced graphics asteroid dodger
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  const WIDTH = (canvas.width = 800);
  const HEIGHT = (canvas.height = 600);

  // ---- Player ---------------------------------------------------
  const player = {
    x: WIDTH / 2,
    y: HEIGHT - 40,
    w: 20,
    h: 20,
    speed: 4,
    color: '#0f0',
  };

  const keys = {};
  addEventListener('keydown', e => (keys[e.key] = true));
  addEventListener('keyup', e => (keys[e.key] = false));
  // optional mouse control – follow mouse x position
  addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
  });

  // ---- Asteroids ------------------------------------------------
  const stars = [];
  // generate starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const asteroids = [];
  const SPAWN_INTERVAL = 800; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const size = 15 + Math.random() * 25;
    asteroids.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
      color: '#f55',
    });
  }

  // ---- Game loop ------------------------------------------------
  let gameOver = false;
  function update(dt) {
  // move starfield slowly to give depth effect
  for (const s of stars) {
    s.y += 0.2; // slow drift
    if (s.y > HEIGHT) {
      s.y = 0;
      s.x = Math.random() * WIDTH;
    }
  }
    // player movement (arrow keys)
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));
    player.y = Math.max(0, Math.min(HEIGHT - player.h, player.y));

    // spawn new asteroids
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // move asteroids and check collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y > HEIGHT) asteroids.splice(i, 1);
      // simple AABB collision
      if (
        a.x < player.x + player.w &&
        a.x + a.w > player.x &&
        a.y < player.y + player.h &&
        a.y + a.h > player.y
      ) {
        gameOver = true;
        playCollisionSound();
      }
    }
  }

  function draw() {
    // dark space background
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // player (glowing triangle)
    const shipGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      2,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w
    );
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#004400');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.fillRect(a.x, a.y, a.w, a.h);
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with overlay
    }
  }

  requestAnimationFrame(loop);
})();
