// Simple Pixel Runner game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 200);

  // simple sound helpers using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function playJumpSound() { beep(440, 100); }
  function playCrashSound() { beep(150, 300); }
  // ensure audio context is running after user interaction
  function ensureAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }

  const player = { x: 50, y: H - 30, w: 20, h: 20, vy: 0, onGround: true };
  const gravity = 0.8;
  const jumpForce = 15;
  const obstacles = [];
  let obstacleTimer = 0;
  const clouds = [];
  let cloudTimer = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
  const size = 20 + Math.random() * 20;
  obstacles.push({ x: W, y: H - size, w: size, h: size });
}

// draw a rounded rectangle for player/obstacles
function drawRoundedRect(x, y, w, h, radius, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// cloud drawing helper
function drawCloud(cx, cy, scale) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const r = 15 * scale;
  ctx.arc(cx, cy, r, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(cx + r, cy - r, r, Math.PI * 1, Math.PI * 1.85);
  ctx.arc(cx + r * 2, cy - r, r, Math.PI * 1.15, Math.PI * 1.85);
  ctx.arc(cx + r * 3, cy, r, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();
}

function spawnCloud() {
  const scale = 0.5 + Math.random() * 0.5;
  const size = 30 * scale;
  const y = 20 + Math.random() * 40;
  clouds.push({ x: W, y, scale });
}
    const size = 20 + Math.random() * 20;
    obstacles.push({ x: W, y: H - size, w: size, h: size });
  }

  function update() {
  // move clouds
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.x -= 2; // slower than obstacles
    if (c.x + 30 < 0) clouds.splice(i, 1);
  }
  cloudTimer--;
  if (cloudTimer <= 0) {
    spawnCloud();
    cloudTimer = 120 + Math.random() * 80;
  }
    if (gameOver) return;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // obstacles move left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5;
      // collision
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playCrashSound();
        gameOver = true;
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn obstacles periodically
    obstacleTimer--;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = 90 + Math.random() * 60; // frames
    }
    // score based on time survived
    score++;
  }

  function draw() {
    // background gradient (sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#fff'); // near horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - 20, W, 20);
    // background already drawn; no clearing needed
    // draw clouds
    clouds.forEach(c => drawCloud(c.x, c.y, c.scale));
    // player
    drawRoundedRect(player.x, player.y, player.w, player.h, 4, '#0f0');
    // obstacles
    obstacles.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 2, '#f00'));

    // score & game over
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input – click or tap to jump
    canvas.addEventListener('mousedown', () => {
      ensureAudio();
      if (player.onGround && !gameOver) {
        player.vy = -jumpForce;
        playJumpSound();
      }
    });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (player.onGround && !gameOver) player.vy = -jumpForce;
  }, { passive: false });

  // start game
  loop();
})();
