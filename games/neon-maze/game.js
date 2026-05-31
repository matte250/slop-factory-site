// Minimal Neon‑Maze implementation
// Canvas with id="game" must exist in the HTML page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // player
  const player = {
    x: W / 2,
    y: H * 0.8,
    r: 6,
    angle: -Math.PI / 2, // facing up
    speed: 2,
  };

  // audio utilities
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollect() { playTone(600, 150); }
  function playCrash() { playTone(150, 300); }

  // game state
  let walls = []; // each wall: {x,y,w,h}
  let flashes = []; // collectibles: {x,y,r,active}
  let score = 0;
  let gameOver = false;

  // input handling
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  function spawnWall() {
    const w = 30 + Math.random() * 70;
    const x = Math.random() * (W - w);
    walls.push({ x, y: -20, w, h: 20 });
  }

  function spawnFlash() {
    const r = 4;
    const x = Math.random() * (W - r * 2) + r;
    const y = -r;
    flashes.push({ x, y, r, active: true });
  }

  // game loop
  function update() {
    if (gameOver) return;
    // rotate player
    if (keys.left) player.angle -= 0.04;
    if (keys.right) player.angle += 0.04;
    // move forward
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
    // wrap horizontally
    if (player.x < 0) player.x += W;
    if (player.x > W) player.x -= W;

    // scroll walls and flashes downwards to simulate forward motion
    walls.forEach(w => w.y += player.speed);
    flashes.forEach(f => f.y += player.speed);

    // remove off‑screen objects
    walls = walls.filter(w => w.y < H + 20);
    flashes = flashes.filter(f => f.y < H + f.r && f.active);

    // spawn new obstacles / points
    if (Math.random() < 0.03) spawnWall();
    if (Math.random() < 0.02) spawnFlash();

    // collision with walls (simple AABB check)
    for (const w of walls) {
      if (
        player.x + player.r > w.x &&
        player.x - player.r < w.x + w.w &&
        player.y + player.r > w.y &&
        player.y - player.r < w.y + w.h
      ) {
        playCrash();
        gameOver = true;
        break;
      }
    }

    // collect flashes
    for (const f of flashes) {
      if (f.active && Math.hypot(player.x - f.x, player.y - f.y) < player.r + f.r) {
        f.active = false;
        score += 10;
        // temporary speed boost
        player.speed = 4;
        setTimeout(() => (player.speed = 2), 300);
      }
    }
  }

  function draw() {
    // clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // neon glow for player
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0ff';
    // radial gradient for glowing dot
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 3);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // neon walls with glow
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0f0';
    ctx.fillStyle = '#0f0';
    walls.forEach(w => {
      ctx.fillRect(w.x, w.y, w.w, w.h);
    });
    ctx.restore();

    // neon flashes with pulse effect
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0';
    flashes.forEach(f => {
      if (!f.active) return;
      const pulse = Math.abs(Math.sin(Date.now() / 200)) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255,255,0,${pulse})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
