// Simple "Cosmic Cleanup" canvas game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  };
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);
  // generate static star field
  const STAR_COUNT = 100;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
  }));
  const drawStars = () => {
    ctx.fillStyle = '#fff';
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const PLAYER_SIZE = 20;
  const PLAYER_SPEED = 3;
  const DEBRIS_SIZE = 12;
  const ASTEROID_SIZE = 30;
  const SPAWN_DEBRIS_INTERVAL = 1500; // ms
  const SPAWN_ASTEROID_INTERVAL = 2000; // ms
  const TARGET_SCORE = 10;
  const TIME_LIMIT = 60; // seconds

  const keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  document.addEventListener('keyup', (e) => (keys[e.key] = false));

  const player = { x: W / 2, y: H / 2, size: PLAYER_SIZE };
  let debris = [];
  let asteroids = [];
  let score = 0;
  let timeLeft = TIME_LIMIT;
  let gameOver = false;

  const randPos = (size) => ({
    x: Math.random() * (W - size),
    y: Math.random() * (H - size),
  });

  const spawnDebris = () => {
    const pos = randPos(DEBRIS_SIZE);
    debris.push({ ...pos, size: DEBRIS_SIZE, collected: false });
  };
  const spawnAsteroid = () => {
    const pos = randPos(ASTEROID_SIZE);
    // random direction vector
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    asteroids.push({ ...pos, size: ASTEROID_SIZE, vx, vy });
  };

  const update = (dt) => {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown) player.y += PLAYER_SPEED;
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED;
    if (keys.ArrowRight) player.x += PLAYER_SPEED;
    // keep inside bounds
    player.x = Math.max(0, Math.min(W - player.size, player.x));
    player.y = Math.max(0, Math.min(H - player.size, player.y));

    // update asteroids
    asteroids.forEach((a) => {
      a.x += a.vx;
      a.y += a.vy;
      // bounce off walls
      if (a.x < 0 || a.x > W - a.size) a.vx *= -1;
      if (a.y < 0 || a.y > H - a.size) a.vy *= -1;
    });

    // check collisions with debris
    debris.forEach((d) => {
      if (!d.collected && rectIntersect(player, d)) {
        d.collected = true;
        playTone(660,150); // collect sound
        score++;
        if (score >= TARGET_SCORE) endGame(true);
      }
    });
    // remove collected debris
    debris = debris.filter((d) => !d.collected);

    // check collision with asteroids
    if (asteroids.some((a) => rectIntersect(player, a))) {
      endGame(false);
    }
  };

  const render = () => {
    ctx.clearRect(0, 0, W, H);
// stars background
  drawStars();
  // player ship (triangle)
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.moveTo(0, -player.size / 2);
  ctx.lineTo(player.size / 2, player.size / 2);
  ctx.lineTo(-player.size / 2, player.size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // debris (glowing circles)
  debris.forEach((d) => {
    const grad = ctx.createRadialGradient(d.x + d.size/2, d.y + d.size/2, 0, d.x + d.size/2, d.y + d.size/2, d.size/2);
    grad.addColorStop(0, '#ff0');
    grad.addColorStop(1, 'rgba(255,165,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(d.x + d.size/2, d.y + d.size/2, d.size/2, 0, Math.PI*2);
    ctx.fill();
  });
  // asteroids (gray gradients)
  asteroids.forEach((a) => {
    const grad = ctx.createRadialGradient(a.x + a.size/2, a.y + a.size/2, a.size/4, a.x + a.size/2, a.y + a.size/2, a.size/2);
    grad.addColorStop(0, '#888');
    grad.addColorStop(1, '#444');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI*2);
    ctx.fill();
  });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}/${TARGET_SCORE}`, 10, 20);
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, W - 100, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      const msg = score >= TARGET_SCORE ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, W / 2, H / 2);
    }
  };

  const rectIntersect = (a, b) =>
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y;

  const endGame = (won) => {
    // play result tone
    if (won) {
      playTone(880, 300); // higher pitch for win
    } else {
      playTone(220, 500); // low pitch for loss
    }
    gameOver = true;
    clearInterval(timerId);
  };

  // spawn loops
  const debrisTimer = setInterval(spawnDebris, SPAWN_DEBRIS_INTERVAL);
  const asteroidTimer = setInterval(spawnAsteroid, SPAWN_ASTEROID_INTERVAL);
  // timer countdown
  const timerId = setInterval(() => {
    if (gameOver) return;
    timeLeft -= 1;
    if (timeLeft <= 0) endGame(false);
  }, 1000);

  let last = performance.now();
  const loop = (now) => {
    const dt = now - last;
    last = now;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
