// Neon Runner – minimal canvas game
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // ----- player ---------------------------------------------------
  const player = {
    w: 20,
    h: 20,
    x: width / 2 - 10,
    y: height - 30,
    speed: 5,
    dx: 0,
  };

  // ----- game state ------------------------------------------------
  let obstacles = [];
  let orbs = [];
  let score = 0;
  let gameOver = false;
  let frames = 0;

  // ----- audio setup ------------------------------------------------
  let audioCtx;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // start background music
      startMusic();
    }
  };
  const playTone = (freq, duration = 0.1, type = 'sine', volume = 0.2) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(800, 0.07, 'square', 0.3);
  const playHit = () => playTone(200, 0.3, 'triangle', 0.5);
  let musicOsc;
  const startMusic = () => {
    if (!audioCtx) return;
    musicOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    musicOsc.type = 'sawtooth';
    musicOsc.frequency.value = 60;
    gain.gain.value = 0.05;
    musicOsc.connect(gain).connect(audioCtx.destination);
    musicOsc.start();
  };
  const stopMusic = () => {
    if (musicOsc) {
      musicOsc.stop();
      musicOsc.disconnect();
      musicOsc = null;
    }
  };

  // ----- input ----------------------------------------------------
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      initAudio(); // unlock audio on first interaction
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  // ----- helpers ---------------------------------------------------
  const rectCollision = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const circleCollision = (c, r) => {
    const cx = c.x + c.r;
    const cy = c.y + c.r;
    const rx = r.x + r.w / 2;
    const ry = r.y + r.h / 2;
    const distX = Math.abs(cx - rx);
    const distY = Math.abs(cy - ry);
    if (distX > r.w / 2 + c.r) return false;
    if (distY > r.h / 2 + c.r) return false;
    if (distX <= r.w / 2) return true;
    if (distY <= r.h / 2) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= c.r * c.r;
  };

  // ----- game loop ------------------------------------------------
  function loop() {
    if (gameOver) {
      ctx.fillStyle = '#ff5555';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 40);
      return;
    }

    // clear with motion blur effect
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, width, height);
    // background gradient (neon tunnel vibe)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // draw player (glowing neon with gradient)
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#07f');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(player.x + 4, player.y);
    ctx.lineTo(player.x + player.w - 4, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + 4);
    ctx.lineTo(player.x + player.w, player.y + player.h - 4);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - 4, player.y + player.h);
    ctx.lineTo(player.x + 4, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - 4);
    ctx.lineTo(player.x, player.y + 4);
    ctx.quadraticCurveTo(player.x, player.y, player.x + 4, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // spawn obstacles every 120 frames
    if (frames % 120 === 0) {
      const size = 20 + Math.random() * 30;
      const ox = Math.random() * (width - size);
      obstacles.push({ x: ox, y: -size, w: size, h: size, speed: 3 });
    }
    // spawn orbs every 180 frames
    if (frames % 180 === 0) {
      const r = 10;
      const ox = Math.random() * (width - r * 2);
      orbs.push({ x: ox, y: -r * 2, r, speed: 2 });
    }

    // update & draw obstacles with gradient and glow
    obstacles.forEach(o => {
      o.y += o.speed;
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#f33');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#f44';
      ctx.shadowBlur = 8;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.shadowBlur = 0;
    obstacles = obstacles.filter(o => o.y < height);

    // update & draw orbs with radial gradient glow
    orbs.forEach(o => {
      o.y += o.speed;
      const grad = ctx.createRadialGradient(o.x + o.r, o.y + o.r, o.r * 0.2, o.x + o.r, o.y + o.r, o.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(o.x + o.r, o.y + o.r, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    orbs = orbs.filter(o => o.y < height);

    // collision detection
    for (const o of obstacles) {
      if (rectCollision(player, o)) {
        gameOver = true;
        playHit();
        stopMusic();
      }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      if (circleCollision(orb, player)) {
        score += 1;
        orbs.splice(i, 1);
        playCollect();
      }
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    frames++;
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
