// Minimal Neon Runner implementation
// Canvas with id="game"
(() => {
  // ---- Audio Setup ----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 200;

  // Game state
  const player = { x: 50, y: height - 30, radius: 12, vy: 0, jumpForce: -9, onGround: true };
  const obstacles = [];
  const gapWidth = 60;
  const obstacleWidth = 20;
  const speed = 3;
  let frames = 0;
  let gameOver = false;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    if (type === 'gap') {
      obstacles.push({ type, x: width, w: gapWidth, h: height });
    } else {
      const h = Math.random() * 40 + 20;
      obstacles.push({ type, x: width, w: obstacleWidth, h, y: height - h });
    }
  }

  function update() {
    if (gameOver) return;
    // player physics
    if (!player.onGround) player.vy += 0.5; // gravity
    player.y += player.vy;
    if (player.y >= height - 30) {
      player.y = height - 30;
      player.vy = 0;
      player.onGround = true;
    }
    // move obstacles
    obstacles.forEach(o => o.x -= speed);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // spawn
    if (frames % 120 === 0) spawnObstacle();
    // collision detection
    for (const o of obstacles) {
      if (o.type === 'gap') {
        if (player.x > o.x && player.x < o.x + o.w && player.y + player.radius >= height - 10) {
          // Gap collision sound
          playTone(220, 0.2);
          gameOver = true;
        }
      } else { // spike
        if (player.x + player.radius > o.x && player.x - player.radius < o.x + o.w) {
          if (player.y + player.radius > o.y) {
            // Spike hit sound
            playTone(110, 0.3);
            gameOver = true;
          }
        }
      }
    }
    frames++;
  }

  function draw() {
    // Neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001122');
    bgGrad.addColorStop(1, '#000014');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // neon ground line
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, height - 6);
    ctx.lineTo(width, height - 6);
    ctx.stroke();
    // player with glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // obstacles
    obstacles.forEach(o => {
      if (o.type === 'gap') {
        // draw a dark gap overlay
        ctx.fillStyle = '#001';
        ctx.fillRect(o.x, 0, o.w, height);
      } else {
        // draw spike as triangle
        ctx.fillStyle = '#f0f';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.onGround && !gameOver) {
      // Ensure audio context is running
      if (audioCtx.state === 'suspended') audioCtx.resume();
      // Jump sound
      playTone(660, 0.15);
      player.vy = player.jumpForce;
      player.onGround = false;
    }
    if (e.code === 'Enter' && gameOver) {
      // reset
      if (audioCtx.state === 'suspended') audioCtx.resume();
      // restart sound
      playTone(440, 0.2);
      obstacles.length = 0;
      player.y = height - 30;
      player.vy = 0;
      player.onGround = true;
      frames = 0;
      gameOver = false;
      loop();
    }
  });

  loop();
})();
