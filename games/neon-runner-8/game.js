// Neon Runner – simple canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playSound = (type) => {
    switch (type) {
      case 'jump':
        playBeep(400, 0.1);
        break;
      case 'hit':
        playBeep(200, 0.3);
        break;
      case 'gameover':
        playBeep(100, 0.5);
        break;
      default:
        break;
    }
  };

  const player = { x: 50, y: H - 30, w: 20, h: 20, vy: 0, onGround: true };
  const gravity = 0.6, jumpStrength = -12;
  const obstacles = [];
  let obstacleTimer = 0;
  let speed = 3;
  let score = 0;
  let running = true;
  let particleTimer = 0;
  let gameOverPlayed = false;

  const reset = () => { obstacles.length = 0; obstacleTimer = 0; speed = 3; score = 0; running = true; player.y = H - 30; player.vy = 0; player.onGround = true; };

  const particles = [];

const draw = () => {
  // Neon background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Neon glow settings
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 10;

  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2;
  // player - filled neon square
  ctx.fillStyle = '#00ffff33';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.strokeRect(player.x, player.y, player.w, player.h);

    // obstacles - neon outlines with glow fill
    obstacles.forEach(o => {
      ctx.fillStyle = '#ff00ff33';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

  // particles
  particles.forEach((p, i) => {
    ctx.fillStyle = p.c;
    ctx.globalAlpha = p.a;
    ctx.fillRect(p.x, p.y, 2, 2);
    ctx.globalAlpha = 1;
  });

  // score
  ctx.fillStyle = '#0ff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
};

  const update = () => {
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.a -= 0.02;
      if (p.a <= 0) particles.splice(i, 1);
    }

    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }
    else player.onGround = false;

    // obstacles
    obstacleTimer -= speed;
    if (obstacleTimer <= 0) {
      const gap = 80 + Math.random() * 120;
      obstacles.push({ x: W, y: H - 30, w: 20, h: 20 });
      obstacleTimer = gap;
    }
    obstacles.forEach(o => o.x -= speed);
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
        running = false;
        playSound('hit');
        break;
      }
    }
    if (!running) return;
    score += speed * 0.1;
    speed = 3 + score / 200; // gradually increase speed
  };

  const loop = () => {
    if (!running) {
      if (!gameOverPlayed) {
        playSound('gameover');
        gameOverPlayed = true;
      }
      ctx.fillStyle = '#f00';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over – Click to Restart', W / 2 - 150, H / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // spawn neon particles
  const spawnParticle = (x, y) => {
    const angle = Math.random() * Math.PI * 2;
    const speedP = Math.random() * 2 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speedP,
      vy: Math.sin(angle) * speedP,
      a: 1,
      c: '#0ff',
    });
  };

  canvas.addEventListener('click', () => {
    // needed for Safari/Chrome autoplay policies
    audioCtx.resume();
    if (!running) { reset(); requestAnimationFrame(loop); return; }
    if (player.onGround) {
      player.vy = jumpStrength;
      playSound('jump');
      // spawn burst of particles
      for (let i = 0; i < 15; i++) spawnParticle(player.x + player.w / 2, player.y + player.h / 2);
    }
  });

  requestAnimationFrame(loop);
})();
