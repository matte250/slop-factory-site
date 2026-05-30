// Simple endless runner game targeting a <canvas id="game"></canvas> with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // support high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.offsetWidth || 400;
  const height = canvas.offsetHeight || 300;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  // audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  const sounds = {
    collect: () => playTone(800), // high beep
    hit: () => playTone(200), // low beep
  };

  // Player: circle moving forward automatically (upwards)
  const player = { x: width / 2, y: height - 30, r: 10, speedX: 0, maxSpeed: 4 };

  // Obstacles and stars arrays
  const obstacles = [];
  const stars = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, w: size, h: size, speedY: 2 + Math.random() * 2 });
  }
  function spawnStar() {
    const size = 8;
    const x = Math.random() * (width - size);
    stars.push({ x, y: -size, r: size / 2, speedY: 2 + Math.random() * 1.5 });
  }

  function update() {
    if (gameOver) return;
    // player horizontal movement
    if (keys.ArrowLeft) player.speedX = -player.maxSpeed;
    else if (keys.ArrowRight) player.speedX = player.maxSpeed;
    else player.speedX = 0;
    player.x = Math.max(player.r, Math.min(width - player.r, player.x + player.speedX));

    // move obstacles and stars down (simulating forward motion)
    obstacles.forEach(o => o.y += o.speedY);
    stars.forEach(s => s.y += s.speedY);

    // remove off‑screen entities
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();
    while (stars.length && stars[0].y > height) stars.shift();

    // collision detection with obstacles
    for (const o of obstacles) {
      const dx = Math.abs(player.x - (o.x + o.w / 2));
      const dy = Math.abs(player.y - (o.y + o.h / 2));
      if (dx < player.r + o.w / 2 && dy < player.r + o.h / 2) { sounds.hit(); gameOver = true; break; }
    }
    // collect stars
for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        const dx = player.x - s.x;
        const dy = player.y - s.y;
        if (dx * dx + dy * dy < (player.r + s.r) ** 2) { sounds.collect(); score++; stars.splice(i, 1); }
      }

    // spawn new obstacles/stars at intervals
    if (frame % 60 === 0) spawnObstacle(); // every second at 60fps
    if (frame % 90 === 0) spawnStar();
    frame++;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // player with radial gradient
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#00a');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // helper for rounded rectangles
    function drawRoundedRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    }

    // obstacles with rounded corners and slight shadow
    ctx.fillStyle = '#a00';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    obstacles.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 4));
    ctx.shadowBlur = 0;

    // stars with glow effect
    stars.forEach(s => {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
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
