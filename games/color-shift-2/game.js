// game.js – enhanced Color Shift graphics
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 400;
  const height = canvas.clientHeight || 600;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  const W = width;
  const H = height;

  // player square
  const player = {
    size: 40,
    x: W / 2 - 20,
    y: H - 60,
    speed: 5,
    color: 'gray',
    move: { left: false, right: false, up: false, down: false },
  };

  // circles pool
  const circles = [];
  const colors = ['red', 'green', 'blue', 'orange'];
  let spawnTimer = 0;
  let spawnInterval = 120; // frames
  let fallSpeed = 2;
  let score = 0;
  let gameOver = false;

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  // input handling
  const onKey = (e, down) => {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const dir = map[e.key];
    if (dir) player.move[dir] = down;
  };
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));

  function spawnCircle() {
    const radius = 15 + Math.random() * 10;
    circles.push({
      x: Math.random() * (W - radius * 2) + radius,
      y: -radius,
      r: radius,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  function update() {
    if (gameOver) return;
    // move player
    if (player.move.left) player.x -= player.speed;
    if (player.move.right) player.x += player.speed;
    if (player.move.up) player.y -= player.speed;
    if (player.move.down) player.y += player.speed;
    // keep inside bounds
    player.x = Math.max(0, Math.min(W - player.size, player.x));
    player.y = Math.max(0, Math.min(H - player.size, player.y));
    // spawn circles
    if (spawnTimer-- <= 0) {
      spawnCircle();
      spawnTimer = spawnInterval;
    }
    // update circles
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += fallSpeed;
      // collision with player square
      const px = player.x, py = player.y, ps = player.size;
      const cx = c.x, cy = c.y, cr = c.r;
      const collides = cx + cr > px && cx - cr < px + ps && cy + cr > py && cy - cr < py + ps;
      if (collides) {
        if (c.color === player.color) {
          score++;
          player.color = c.color; // keep same
          // play success tone based on color
          const freqMap = { red: 440, green: 480, blue: 520, orange: 460 };
          playTone(freqMap[c.color] || 440, 0.15);
        } else {
          gameOver = true;
          // play failure tone
          playTone(150, 0.4);
        }
        circles.splice(i, 1);
        continue;
      }
      // remove off-screen
      if (c.y - c.r > H) circles.splice(i, 1);
    }
    // increase difficulty
    if (score && score % 10 === 0) {
      fallSpeed = Math.min(10, fallSpeed + 0.2);
      spawnInterval = Math.max(30, spawnInterval - 2);
    }
  }

  function draw() {
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0e0e2f');
    bg.addColorStop(1, '#1e1e4f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // draw circles with radial gradient and glow
    circles.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      grad.addColorStop(0, 'white');
      grad.addColorStop(1, c.color);
      ctx.save();
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });

    // draw player with rounded corners and glow
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    const r = 6; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.size - r, player.y);
    ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + r);
    ctx.lineTo(player.x + player.size, player.y + player.size - r);
    ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - r, player.y + player.size);
    ctx.lineTo(player.x + r, player.y + player.size);
    ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.restore();

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'yellow';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // start
  player.color = colors[0]; // initial color
  requestAnimationFrame(loop);
})();
