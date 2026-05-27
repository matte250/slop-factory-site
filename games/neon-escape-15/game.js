// Neon Escape – simple canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  };

  // size canvas to fill window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // player – glowing dot
  const player = { x: canvas.width / 2, y: canvas.height - 80, r: 8, speed: 4 };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };

  const onKey = (e, down) => {
    if (e.key in keys) keys[e.key] = down;
    // WASD mapping
    if (e.key === 'w') keys['ArrowUp'] = down;
    if (e.key === 'a') keys['ArrowLeft'] = down;
    if (e.key === 's') keys['ArrowDown'] = down;
    if (e.key === 'd') keys['ArrowRight'] = down;
  };
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));

  // walls – moving rectangles
  const walls = [];
  const wallHeight = 20;
  const wallGap = 120; // vertical gap between wall rows
  const wallSpeed = 2;
  let wallTimer = 0;

  // orbs – collectable circles
  const orbs = [];
  const orbRadius = 6;
  const orbSpeed = wallSpeed;
  let orbTimer = 0;

  let score = 0;
  let gameOver = false;

  // starfield
  const stars = [];
  const starCount = 80;
  const starSpeed = 0.5;
  const initStars = () => {
    for (let i = 0; i < starCount; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    }
  };
  initStars();

  const spawnWallRow = () => {
    const cols = 8;
    const colWidth = canvas.width / cols;
    const opening = Math.floor(Math.random() * cols);
    for (let i = 0; i < cols; i++) {
      if (i === opening) continue;
      walls.push({ x: i * colWidth, y: -wallHeight, w: colWidth - 2, h: wallHeight });
    }
  };

  const spawnOrb = () => {
    const x = Math.random() * canvas.width;
    orbs.push({ x, y: -orbRadius, r: orbRadius });
  };

  const update = () => {
    if (gameOver) return;
    // move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    // spawn walls periodically
    wallTimer += 1;
    if (wallTimer > wallGap) { spawnWallRow(); wallTimer = 0; }

    // spawn orbs occasionally
    orbTimer += 1;
    if (orbTimer > 150) { spawnOrb(); orbTimer = 0; }

    // move stars for parallax effect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += starSpeed;
      if (s.y > canvas.height) {
        s.y = -2;
        s.x = Math.random() * canvas.width;
      }
    }

    // move walls
    for (let i = walls.length - 1; i >= 0; i--) {
      const w = walls[i];
      w.y += wallSpeed;
      // collision with player
      const dx = Math.max(w.x - player.x, 0, player.x - (w.x + w.w));
      const dy = Math.max(w.y - player.y, 0, player.y - (w.y + w.h));
      if (dx * dx + dy * dy < player.r * player.r) { playTone(200, 0.3); gameOver = true; }
      if (w.y > canvas.height) walls.splice(i, 1);
    }

    // move orbs and check collection
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += orbSpeed;
      const distSq = (o.x - player.x) ** 2 + (o.y - player.y) ** 2;
      if (distSq < (o.r + player.r) ** 2) {
        score++;
        playTone(800, 0.08); // collect sound
        orbs.splice(i, 1);
        continue;
      }
      if (o.y - o.r > canvas.height) orbs.splice(i, 1);
    }
  };

  const draw = () => {
    // neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // starfield (tiny white points)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    // neon glow for player
    const playerGrad = ctx.createRadialGradient(
      player.x,
      player.y,
      player.r,
      player.x,
      player.y,
      player.r + 12
    );
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // walls with neon glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0f0';
    ctx.fillStyle = '#0f0';
    walls.forEach(w => {
      ctx.fillRect(w.x, w.y, w.w, w.h);
    });
    ctx.shadowBlur = 0;

    // orbs with soft glow
    const orbGrad = ctx.createRadialGradient(0,0,0,0,0,0);
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, o.r, o.x, o.y, o.r + 8);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // score text with neon outline
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 4;
    ctx.fillText('Score: ' + score, 20, 30);
    ctx.shadowBlur = 0;

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
