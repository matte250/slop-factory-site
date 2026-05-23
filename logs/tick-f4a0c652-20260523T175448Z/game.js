// Simple Neon Runner game
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('click', resumeAudio, { once: true });
  canvas.addEventListener('touchstart', resumeAudio, { once: true });

  const playSound = (freq, type = 'sine', duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.6, JUMP = -12, SPEED = 4;
  let score = 0, lives = 3, running = true;

  const player = { x: 80, y: canvas.height - 30, r: 12, vy: 0, onGround: true };
  const obstacles = [], shards = [];
  let frame = 0;

  const spawnObstacle = () => {
    const h = 20 + Math.random() * 30;
    obstacles.push({ x: canvas.width, y: canvas.height - h, w: 20, h });
  };
  const spawnShard = () => {
    const size = 8;
    const y = canvas.height - 30 - Math.random() * 120;
    shards.push({ x: canvas.width, y, size });
  };

  const rectCollision = (p, o) => {
    const distX = Math.abs(p.x - o.x - o.w / 2);
    const distY = Math.abs(p.y - o.y - o.h / 2);
    return distX <= o.w / 2 + p.r && distY <= o.h / 2 + p.r;
  };
  const circleCollision = (p, s) => {
    const dx = p.x - s.x; const dy = p.y - s.y;
    return dx * dx + dy * dy < (p.r + s.size) ** 2;
  };

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= canvas.height - player.r) {
      player.y = canvas.height - player.r;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles movement
    obstacles.forEach(o => o.x -= SPEED);
    shards.forEach(s => s.x -= SPEED);
    // spawn logic
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 180 === 0) spawnShard();
    // collision detection
    obstacles.forEach((o, i) => {
      if (rectCollision(player, o)) {
          playSound(120, 'sawtooth', 0.2); // collision sound
        obstacles.splice(i, 1);
        lives--;
        if (lives <= 0) running = false;
      }
    });
    shards.forEach((s, i) => {
if (circleCollision(player, s)) {
          shards.splice(i, 1);
          score += 10;
          playSound(600, 'triangle', 0.05); // shard collect sound
        }
    });
    // cleanup offscreen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (shards.length && shards[0].x + shards[0].size < 0) shards.shift();
    frame++;
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient and grid lines
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // subtle vertical neon grid
    ctx.strokeStyle = 'rgba(0,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // player with neon glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#006');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // obstacles with neon glow
    ctx.save();
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8;
    obstacles.forEach(o => {
      // draw with gradient for depth
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#ff4d4d');
      grad.addColorStop(1, '#990000');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.restore();
    // shards with neon glow
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 10;
    shards.forEach(s => {
      const grad = ctx.createRadialGradient(s.x, s.y, s.size * 0.2, s.x, s.y, s.size);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#660');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
  };

  const loop = () => {
    if (!running) { ctx.fillStyle = '#fff'; ctx.fillText('Game Over', canvas.width / 2 - 40, canvas.height / 2); return; }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // input
  const onJump = (e) => {
    if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
      playSound(300, 'square', 0.08); // jump sound
    }
  };
  canvas.addEventListener('click', onJump);
  canvas.addEventListener('touchstart', onJump);

  loop();
})();
