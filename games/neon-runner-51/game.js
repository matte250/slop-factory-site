// Neon Runner – enhanced graphics version
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 400);

  // audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // ------- configuration -------
  const PLAYER_R = 8;
  const PLAYER_SPEED = 2.5;
  const SCROLL_SPEED = 2.5;
  const OBSTACLE_W = 20;
  const OBSTACLE_H = 40;
  const TOKEN_R = 5;
  const OBSTACLE_INTERVAL = 1500; // ms
  const TOKEN_INTERVAL = 2000; // ms

  // ------- state -------
  const player = { x: W * 0.2, y: H / 2, dx: 0, dy: 0 };
  const obstacles = [];
  const tokens = [];
  let lastObs = 0,
    lastTok = 0,
    score = 0,
    running = true;
  const keys = {};

  // ------- input -------
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  const updatePlayer = () => {
    if (keys.ArrowUp || keys.w) player.dy = -PLAYER_SPEED;
    else if (keys.ArrowDown || keys.s) player.dy = PLAYER_SPEED;
    else player.dy = 0;
    if (keys.ArrowLeft || keys.a) player.dx = -PLAYER_SPEED;
    else if (keys.ArrowRight || keys.d) player.dx = PLAYER_SPEED;
    else player.dx = 0;
    player.x = Math.max(0, Math.min(W, player.x + player.dx));
    player.y = Math.max(0, Math.min(H, player.y + player.dy));
  };

  const spawnObstacle = () => {
    const gap = 80; // vertical gap for the player to pass
    const topHeight = Math.random() * (H - gap);
    obstacles.push({ x: W, y: 0, w: OBSTACLE_W, h: topHeight }); // top block
    obstacles.push({ x: W, y: topHeight + gap, w: OBSTACLE_W, h: H - topHeight - gap }); // bottom block
  };

  const spawnToken = () => {
    const y = Math.random() * (H - 20) + 10;
    tokens.push({ x: W, y, r: TOKEN_R });
  };

  const rectCircleCollide = (rect, cx, cy, cr) => {
    const rx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ry = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - rx;
    const dy = cy - ry;
    return dx * dx + dy * dy <= cr * cr;
  };

  const checkCollisions = () => {
    // player vs obstacles
    for (const o of obstacles) {
      if (rectCircleCollide(o, player.x, player.y, PLAYER_R)) return true;
    }
    // player vs tokens
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      const d2 = (player.x - t.x) ** 2 + (player.y - t.y) ** 2;
      if (d2 < (PLAYER_R + t.r) ** 2) {
        score += 10; // token bonus
        tokens.splice(i, 1);
        playSound(800, 0.08); // token collect sound
      }
    }
    return false;
  };

  // draw neon grid with glowing lines
const drawGrid = () => {
    const step = 40;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    for (let x = 0; x <= W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // reset shadow for later drawing
    ctx.shadowBlur = 0;
  };

  const render = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    drawGrid();
    // obstacles with neon glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.shadowBlur = 0; // reset
    // tokens with pulsing neon
    for (const t of tokens) {
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 10 * pulse;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset for player
    // player with outer glow and trailing effect
    // trail effect (simple afterimage)
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(player.x - player.dx * 2, player.y - player.dy * 2, PLAYER_R * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f';
    ctx.fill();
    ctx.globalAlpha = 1;
    const grad = ctx.createRadialGradient(player.x, player.y, PLAYER_R, player.x, player.y, PLAYER_R * 4);
    grad.addColorStop(0, '#f0f');
    grad.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const loop = (timestamp) => {
    if (!running) return;
    // spawn obstacles / tokens
    if (timestamp - lastObs > OBSTACLE_INTERVAL) {
      spawnObstacle();
      lastObs = timestamp;
    }
    if (timestamp - lastTok > TOKEN_INTERVAL) {
      spawnToken();
      lastTok = timestamp;
    }
    // move entities left
    obstacles.forEach((o) => (o.x -= SCROLL_SPEED));
    tokens.forEach((t) => (t.x -= SCROLL_SPEED));
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + OBSTACLE_W < 0) obstacles.shift();
    while (tokens.length && tokens[0].x + TOKEN_R < 0) tokens.shift();
    updatePlayer();
    if (checkCollisions()) {
      // collision sound
      playSound(200, 0.3);
      running = false;
      render();
      ctx.fillStyle = '#f88';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
      return;
    }
    score++; // base score per frame
    render();
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
