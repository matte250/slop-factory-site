// Canvas Runner – minimal endless‑runner implementation

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;

  // ------- game state -------------------------------------------------
  const player = { x: 50, y: H - 50, w: 30, h: 30, vy: 0, jump: -12 };
  const gravity = 0.6;
  const obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 100; // frames
  let score = 0;
  let running = true;

  // ------- audio setup ------------------------------------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // ------- input ------------------------------------------------------
  const jump = () => {
    if (player.vy === 0) {
      player.vy = player.jump;
      // play jump sound (high ping)
      audioCtx.resume().then(() => beep(660, 0.07));
    }
  };
  document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // ------- helpers ----------------------------------------------------
  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ------- main loop --------------------------------------------------
  function loop() {
    if (!running) return;
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 10);
    ctx.lineTo(W, H - 10);
    ctx.stroke();

    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; }

    // draw player with gradient circle
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      5,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    playerGrad.addColorStop(0, '#66f');
    playerGrad.addColorStop(1, '#00a');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // obstacle spawning
    if (spawnTimer-- <= 0) {
      const size = 20 + Math.random() * 30;
      obstacles.push({ x: W, y: H - size, w: size, h: size });
      spawnTimer = spawnInterval;
    }

    // update & draw obstacles (spike triangles with gradient)
    const spikeGrad = ctx.createLinearGradient(0, 0, 0, H);
    spikeGrad.addColorStop(0, '#f66');
    spikeGrad.addColorStop(1, '#a00');
    ctx.fillStyle = spikeGrad;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5; // speed
      // draw spike (isosceles triangle pointing up)
      ctx.beginPath();
      ctx.moveTo(o.x, H - 10);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, H - 10);
      ctx.closePath();
      ctx.fill();
      // collision (approximate using bounding box)
      if (rectCollide(player, {x:o.x, y:o.y, w:o.w, h:o.h})) {
        running = false;
        // play collision sound (low buzz)
        audioCtx.resume().then(() => beep(220, 0.3));
        break;
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // score
    score++;
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 10), 10, 20);

    if (running) requestAnimationFrame(loop);
    else gameOver();
  }

  function gameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', W / 2, H / 2 - 20);
    ctx.fillText('Score: ' + Math.floor(score / 10), W / 2, H / 2 + 20);
    ctx.font = '16px sans-serif';
    ctx.fillText('Click to restart', W / 2, H / 2 + 50);
    canvas.addEventListener('pointerdown', restart, { once: true });
  }

  function restart() {
    // reset state
    obstacles.length = 0;
    player.y = H - 50; player.vy = 0;
    score = 0; spawnTimer = 0; running = true;
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
