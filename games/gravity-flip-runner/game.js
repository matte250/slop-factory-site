// Simple Gravity Flip Runner
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 200;

  const player = { x: 50, y: H - 30, w: 20, h: 30, vy: 0, g: 0.6, onGround: true };
  let gravityDown = true; // true = pull down, false = pull up
  const obstacles = [];
  let frame = 0;
  let gameOver = false;

  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context resumes on first interaction
  function resumeAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function reset() {
    player.y = gravityDown ? H - player.h : 0;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    frame = 0;
    gameOver = false;
  }

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const y = gravityDown ? H - size : 0; // on floor/ceiling
    obstacles.push({ x: W, y, w: size, h: size });
    // play spawn sound
    playTone(200, 0.05);
  }

  function update() {
    if (gameOver) return;
    // player gravity
    player.vy += gravityDown ? player.g : -player.g;
    player.y += player.vy;
    // ground/ceiling collision
    if (gravityDown) {
      if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }
      else if (player.y <= 0) { player.y = 0; player.vy = 0; player.onGround = true; }
    } else {
      if (player.y <= 0) { player.y = 0; player.vy = 0; player.onGround = true; }
      else if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }
    }
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= 4;
      // collision check
      const o = obstacles[i];
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        // collision sound
        resumeAudio();
        playTone(100, 0.3);
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn new obstacles
    if (frame % 120 === 0) spawnObstacle();
    frame++;
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, W, H);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Ground / ceiling line
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 1);
    ctx.lineTo(W, H - 1);
    ctx.moveTo(0, 1);
    ctx.lineTo(W, 1);
    ctx.stroke();
    // Player as rounded rectangle
    ctx.fillStyle = '#0f0';
    drawRoundedRect(player.x, player.y, player.w, player.h, 5);
    // Obstacles as spikes
    ctx.fillStyle = '#f44';
    obstacles.forEach(o => drawSpike(o.x, o.y, o.w, o.h, gravityDown));
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  // Helper: draw rounded rectangle
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

  // Helper: draw spike obstacle (triangle)
  function drawSpike(x, y, w, h, down) {
    ctx.beginPath();
    if (down) {
      // spike from floor upwards
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
    } else {
      // spike from ceiling downwards
      ctx.moveTo(x, y);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x + w, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // gravity flip on space or click
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      gravityDown = !gravityDown;
      resumeAudio();
      playTone(400, 0.07);
    }
    if (e.code === 'KeyR') reset();
  });
  canvas.addEventListener('click', () => {
    gravityDown = !gravityDown;
    resumeAudio();
    playTone(400, 0.07);
  });

  reset();
  requestAnimationFrame(loop);
})();
