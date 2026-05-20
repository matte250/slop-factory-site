// game.js – Canvas Escape (endless runner)
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // player (triangle) state
  const player = {
    x: W / 2,
    y: H - 30,
    size: 20,
    vy: 0,
    onGround: true,
  };

  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;

  // obstacles – simple rectangles
  const obstacles = [];
  const OBSTACLE_W = 40;
  const OBSTACLE_H = 20;
  const OBSTACLE_SPEED = 3;
  let obstacleTimer = 0;
  const OBSTACLE_INTERVAL = 90; // frames

  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function reset() {
    player.x = W / 2;
    player.y = H - 30;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    obstacleTimer = 0;
    gameOver = false;
    // resume audio context (required after user gesture)
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function update() {
    if (gameOver) return;
    // player horizontal movement
    if (keys.ArrowLeft) player.x -= 5;
    if (keys.ArrowRight) player.x += 5;
    // keep within bounds
    player.x = Math.max(player.size, Math.min(W - player.size, player.x));

    // jump
    if (keys.ArrowUp && player.onGround) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
    // gravity
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= H - 30) {
      player.y = H - 30;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles generation
    if (obstacleTimer-- <= 0) {
      obstacleTimer = OBSTACLE_INTERVAL;
      const x = Math.random() * (W - OBSTACLE_W);
      obstacles.push({ x, y: -OBSTACLE_H, w: OBSTACLE_W, h: OBSTACLE_H });
    }
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += OBSTACLE_SPEED;
      // remove off‑screen
      if (o.y > H) obstacles.splice(i, 1);
    }

    // collision detection (simple AABB against player bounding box)
    const pBox = {
      left: player.x - player.size,
      right: player.x + player.size,
      top: player.y - player.size,
      bottom: player.y + player.size,
    };
    for (const o of obstacles) {
      if (
        pBox.right > o.x &&
        pBox.left < o.x + o.w &&
        pBox.bottom > o.y &&
        pBox.top < o.y + o.h
      ) {
        gameOver = true;
        playTone(200, 0.4); // collision sound
        break;
      }
    }
  }

function draw() {
    // background gradient sky
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87CEEB'); // light blue
    bgGrad.addColorStop(1, '#B0E0E6'); // powder blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ground strip
    ctx.fillStyle = '#4b5320';
    ctx.fillRect(0, H - 20, W, 20);

    // player – triangle with gradient fill (shadow)
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(player.x + 3, player.y - player.size + 3);
    ctx.lineTo(player.x - player.size + 3, player.y + player.size + 3);
    ctx.lineTo(player.x + player.size + 3, player.y + player.size + 3);
    ctx.closePath();
    ctx.fill();
    // gradient triangle
    const grad = ctx.createLinearGradient(0, player.y - player.size, 0, player.y + player.size);
    grad.addColorStop(0, '#4fa9ff');
    grad.addColorStop(1, '#0b79d0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size, player.y + player.size);
    ctx.lineTo(player.x + player.size, player.y + player.size);
    ctx.closePath();
    ctx.fill();

    // obstacles – rounded rectangles with alternating colors
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const radius = 4;
      ctx.fillStyle = i % 2 === 0 ? '#c33' : '#a52a2a';
      ctx.beginPath();
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.w - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      ctx.lineTo(o.x + o.w, o.y + o.h - radius);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      ctx.lineTo(o.x + radius, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
    }

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Press R to Restart', W / 2, H / 2);
    }
  }
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Press R to Restart', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // restart on R key when game over
  window.addEventListener('keydown', e => {
    if (gameOver && e.key === 'r') reset();
  });

  reset();
  loop();
})();
