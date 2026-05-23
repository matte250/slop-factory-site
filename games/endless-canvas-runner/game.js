// Simple endless runner for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 300;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  const player = { w: 30, h: 30, x: W / 2 - 15, y: H - 40, speed: 5 };
  const keys = {};
  const obstacles = [];
  let spawnTimer = 0;
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update(dt) {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    // spawn obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const w = 20 + Math.random() * 60;
      obstacles.push({ x: Math.random() * (W - w), y: -20, w, h: 20, speed: 100 + Math.random() * 100 });
      // play short tone on obstacle spawn
      playTone(300, 0.07);
      spawnTimer = 0.8; // seconds
    }

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed * dt;
      // collision
      if (!gameOver &&
        o.x < player.x + player.w &&
        o.x + o.w > player.x &&
        o.y < player.y + player.h &&
        o.y + o.h > player.y) {
        // play collision sound
        playTone(100, 0.3);
        gameOver = true;
      }
      // remove off‑screen
      if (o.y > H) obstacles.splice(i, 1);
    }

    score += dt;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#444');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // player – rounded square with subtle shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 6);
    ctx.fill();
    ctx.restore();

    // obstacles – gradient rectangles
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#ff6633');
      grad.addColorStop(1, '#cc3300');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // score – white with shadow for readability
    ctx.save();
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.restore();

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(ts) {
    const dt = (ts - lastTime) / 1000; // seconds
    lastTime = ts;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
