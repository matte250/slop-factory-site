// Simple falling‑blocks game targeting canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, ms) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  };

  // ----- player -----
  const player = { w: 30, h: 30, x: W / 2 - 15, y: H - 35, speed: 5, dir: 0, shield: 0, boost: 0 };

  // ----- entities -----
  const blocks = [];
  const powerUps = [];
  let blockSpeed = 2;
  let lastBlock = 0, lastPower = 0;
  let gameOver = false;

  // ----- input -----
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') player.dir = -1;
    if (e.key === 'ArrowRight') player.dir = 1;
    if (e.key === ' ') e.preventDefault(); // prevent scroll
  });
  document.addEventListener('keyup', e => {
    if ((e.key === 'ArrowLeft' && player.dir === -1) || (e.key === 'ArrowRight' && player.dir === 1)) player.dir = 0;
  });

  // ----- helpers -----
  const now = () => performance.now();
  const rectsCollide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const circlesCollide = (c, r) => {
    const dx = c.x - r.x - r.w / 2;
    const dy = c.y - r.y - r.h / 2;
    const distance = Math.hypot(dx, dy);
    return distance < c.r + Math.min(r.w, r.h) / 2;
  };

  // ----- graphics helpers -----
  const drawRoundedRect = (x, y, w, h, radius, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();
  };

  const drawBoost = (p) => {
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.moveTo(p.x + p.r, p.y);
    ctx.lineTo(p.x + p.r * 2, p.y + p.r * 2);
    ctx.lineTo(p.x, p.y + p.r * 2);
    ctx.closePath();
    ctx.fill();
  };

  const drawShield = (p) => {
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    const cx = p.x + p.r;
    const cy = p.y + p.r;
    const spikes = 6;
    const outer = p.r;
    const inner = p.r * 0.5;
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const rad = i % 2 === 0 ? outer : inner;
      ctx.lineTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
    }
    ctx.closePath();
    ctx.fill();
  };

  // create static starfield
  const stars = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, radius: Math.random() * 1.5 + 0.5 }));

  // ----- main loop -----
  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      return;
    }

    // spawn blocks
    if (timestamp - lastBlock > 1000) {
      blocks.push({ x: Math.random() * (W - 30), y: -30, w: 30, h: 30, speed: blockSpeed });
      lastBlock = timestamp;
      blockSpeed += 0.02; // gradual speed increase
    }
    // spawn power‑ups
    if (timestamp - lastPower > 8000) {
      const type = Math.random() < 0.5 ? 'boost' : 'shield';
      powerUps.push({ x: Math.random() * (W - 20), y: -20, r: 10, type, speed: blockSpeed * 0.8 });
      lastPower = timestamp;
    }

    // update player
    player.x += player.dir * (player.speed + player.boost);
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    if (player.shield > 0) player.shield -= 1;
    if (player.boost > 0) player.boost -= 1;

    // update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      if (b.y > H) blocks.splice(i, 1);
      else if (rectsCollide(player, b)) {
        if (player.shield) {
          // consume shield
          player.shield = 0;
          blocks.splice(i, 1);
        } else {
          // play death sound
          playTone(150, 400);
          gameOver = true;
        }
      }
    }

    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y > H) powerUps.splice(i, 1);
      else if (circlesCollide(p, player)) {
        if (p.type === 'boost') player.boost = 120; // frames
        else if (p.type === 'shield') player.shield = 300; // frames
        powerUps.splice(i, 1);
      }
    }

    // draw
    // background starfield
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // player with rounded rect, color indicates shield
    const playerColor = player.shield ? '#0ff' : '#0f0';
    drawRoundedRect(player.x, player.y, player.w, player.h, 6, playerColor);
    // blocks with gradient fill
    blocks.forEach(b => {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      drawRoundedRect(b.x, b.y, b.w, b.h, 4, grad);
    });
    // power‑ups using custom shapes
    powerUps.forEach(p => {
      if (p.type === 'boost') {
        drawBoost(p);
      } else if (p.type === 'shield') {
        drawShield(p);
      }
    });

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
