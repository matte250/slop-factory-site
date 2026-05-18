// Pixel Runner – minimal endless runner
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Player
  const player = { x: 50, y: H - 40, w: 20, h: 20, vy: 0, onGround: true };
  const GRAV = 0.6, JUMP = -12;

  // Game state
  let obstacles = [];
  let orbs = [];
  let speed = 4; // horizontal scroll
  let energy = 100;
  let running = true;
  let frame = 0;
  let gameOverSoundPlayed = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playTone(440, 0.1);
  const playCollect = () => playTone(660, 0.08);
  const playCollision = () => playTone(200, 0.3);
  const playGameOver = () => playTone(100, 0.5);

  // Input
  const jump = () => {
    if (player.onGround) { player.vy = JUMP; player.onGround = false; playJump(); }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  const spawnObstacle = () => {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 30;
    obstacles.push({ x: W, y: H - h, w, h });
  };
  const spawnOrb = () => {
    const r = 8;
    const y = H - 80 - Math.random() * 120;
    orbs.push({ x: W, y, r });
  };

  const rectIntersect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const circleRectIntersect = (c, r) => {
    const distX = Math.abs(c.x - r.x - r.w / 2);
    const distY = Math.abs(c.y - r.y - r.h / 2);
    if (distX > (r.w / 2 + c.r) || distY > (r.h / 2 + c.r)) return false;
    if (distX <= r.w / 2 || distY <= r.h / 2) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= c.r * c.r;
  };

  const update = () => {
    // player physics
    player.vy += GRAV;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }

    // move obstacles & orbs
    obstacles.forEach(o => o.x -= speed);
    orbs.forEach(o => o.x -= speed);
    // remove off‑screen
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    orbs = orbs.filter(o => o.x + o.r > 0);

    // spawn logic
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 180 === 0) spawnOrb();

    // collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (rectIntersect(player, obstacles[i])) {
        playCollision();
        running = false;
        break;
      }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
        if (circleRectIntersect({ x: orb.x, y: orb.y, r: orb.r }, player)) {
          energy = Math.min(100, energy + 20);
          orbs.splice(i, 1);
          playCollect();
        }
    }
    // energy drain
    energy -= 0.05;
    if (energy <= 0) running = false;
    frame++;
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ground line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.stroke();

    // player – rounded rectangle
    ctx.fillStyle = '#0ff';
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // obstacles – rounded rect with gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#ff4444');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      const r = 3;
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.w - r, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + r);
      ctx.lineTo(o.x + o.w, o.y + o.h - r);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - r, o.y + o.h);
      ctx.lineTo(o.x + r, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.closePath();
      ctx.fill();
    });

    // orbs – glowing radial gradient
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#ffffaa');
      grad.addColorStop(1, '#ffaa00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // energy bar – background and foreground
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, energy, 10);

    // game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  const loop = () => {
    if (running) update();
    draw();
    if (!running && !gameOverSoundPlayed) {
      playGameOver();
      gameOverSoundPlayed = true;
    }
    if (running) requestAnimationFrame(loop);
  };
  // resume audio context on first user interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  canvas.addEventListener('click', resumeAudio, { once: true });
  loop();
})();
