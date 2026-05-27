// Minimal Space Runner game – targets <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Ensure canvas size matches its CSS size (fallback 800x400)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  // ----- Game state -------------------------------------------------------
  const state = {
    player: { x: 50, y: canvas.height / 2, w: 20, h: 20, dy: 0 },
    obstacles: [],
    orbs: [],
    stars: [], // background starfield
    tick: 0,
    speed: 2,
    score: 0,
    running: true,
  };

  // pre‑populate stars
  for (let i = 0; i < 100; i++) {
    state.stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // ----- Audio setup -------------------------------------------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.11);
    }, duration);
  };
  const playBoost = () => playTone(440, 100);
  const playCollect = () => playTone(880, 80);
  const playCrash = () => playTone(220, 300);

// ----- Input -----------------------------------------------------------
  const onKey = (e, down) => {
    if (e.key === 'ArrowUp') {
      state.player.dy = down ? -4 : 0;
      if (down) playBoost();
    } else if (e.key === 'ArrowDown') {
      state.player.dy = down ? 4 : 0;
      if (down) playBoost();
    }
  };
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));

  // ----- Helpers ----------------------------------------------------------
  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const circleCollide = (c, r) => {
    const dx = c.x - r.x;
    const dy = c.y - r.y;
    const dist = Math.hypot(dx, dy);
    return dist < c.r + r.r;
  };

  // ----- Spawn ------------------------------------------------------------
  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    state.obstacles.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - size),
      w: size,
      h: size,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
    });
  };
  const spawnOrb = () => {
    const r = 8;
    state.orbs.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 2 * r) + r,
      r,
    });
  };

  // ----- Main loop --------------------------------------------------------
  const update = () => {
    if (!state.running) return;
    state.tick++;
    // increase difficulty
    if (state.tick % 300 === 0) state.speed += 0.3;
    // spawn objects
    if (state.tick % 80 === 0) spawnObstacle();
    if (state.tick % 150 === 0) spawnOrb();

    // move player
    state.player.y += state.player.dy;
    // keep within bounds
    if (state.player.y < 0) state.player.y = 0;
    if (state.player.y + state.player.h > canvas.height) state.player.y = canvas.height - state.player.h;

    // move background stars for parallax effect
    state.stars.forEach(star => {
      star.x -= star.speed * state.speed * 0.5; // slower than obstacles
      if (star.x < 0) {
        star.x = canvas.width + star.radius;
        star.y = Math.random() * canvas.height;
        star.speed = Math.random() * 0.5 + 0.2;
      }
    });

    // move obstacles, rotate, and remove off‑screen
    state.obstacles.forEach(o => {
      o.x -= state.speed;
      o.angle += o.rotSpeed;
    });
    state.obstacles = state.obstacles.filter(o => o.x + o.w > 0);
    // move orbs & remove off‑screen
    state.orbs.forEach(o => (o.x -= state.speed));
    state.orbs = state.orbs.filter(o => o.x + o.r > 0);

    // collision detection
    for (const o of state.obstacles) {
      if (rectCollide(state.player, o)) {
        playCrash();
        state.running = false;
        break;
      }
    }
    // orb collection
    state.orbs = state.orbs.filter(o => {
      const collected = circleCollide({ x: state.player.x + state.player.w / 2, y: state.player.y + state.player.h / 2, r: state.player.w / 2 }, o);
      if (collected) state.score += 10;
      return !collected;
    });

    // out‑of‑bounds lose condition
    if (state.player.y < 0 || state.player.y + state.player.h > canvas.height) state.running = false;

    // scoring (distance based)
    state.score += state.speed * 0.05;
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // starfield
    ctx.fillStyle = '#fff';
    for (const star of state.stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // player (ship – simple triangle with outline)
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y + state.player.h / 2);
    ctx.lineTo(state.player.x + state.player.w, state.player.y);
    ctx.lineTo(state.player.x + state.player.w, state.player.y + state.player.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // obstacles (asteroids – rotating gray rocks)
    for (const o of state.obstacles) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.angle);
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.arc(0, 0, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // orbs (energy – glowing gradient)
    for (const o of state.orbs) {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      orbGrad.addColorStop(0, '#ff0');
      orbGrad.addColorStop(1, '#aa0');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI – score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(state.score), 10, 20);

    // Game over overlay
    if (!state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    if (!state.running) {
      draw();
      return; // stop animation
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // start the game
  requestAnimationFrame(loop);
})();
