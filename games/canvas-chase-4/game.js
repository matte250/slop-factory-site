// Canvas Chase – minimal endless runner
// Assumes an HTML <canvas id="game"></canvas> exists.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  const GRAVITY = 0.5;
  const JUMP_VELOCITY = -10;
  const PLAYER_SIZE = 30;
  const SCROLL_SPEED = 3;
  const OBSTACLE_FREQ = 120; // frames
  const STAR_FREQ = 90;

  let frame = 0;
  let score = 0;
  let gameOver = false;

  const player = {
    x: 50,
    y: height - PLAYER_SIZE,
    vy: 0,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    onGround: true,
  };

  const obstacles = [];
  const stars = [];

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const type = Math.random() < 0.5 ? 'spike' : 'wall';
    const obs = {
      x: width,
      y: type === 'spike' ? height - size : height - size,
      w: size,
      h: size,
      type,
    };
    obstacles.push(obs);
  }

  function spawnStar() {
    const size = 15;
    const star = {
      x: width,
      y: height * 0.3 + Math.random() * height * 0.4,
      w: size,
      h: size,
    };
    stars.push(star);
  }

  function update() {
    if (gameOver) return;
    frame++;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > height - PLAYER_SIZE) {
      player.y = height - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    }

    // input – click / tap to jump
    // (event listener set once)

    // scroll obstacles and stars
    obstacles.forEach(o => o.x -= SCROLL_SPEED);
    stars.forEach(s => s.x -= SCROLL_SPEED);

    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].w < 0) stars.shift();

    // spawn
    if (frame % OBSTACLE_FREQ === 0) spawnObstacle();
    if (frame % STAR_FREQ === 0) spawnStar();

    // collision detection
    for (const o of obstacles) {
      if (rectIntersect(player, o)) {
        gameOver = true;
        playGameOverSound();
        break;
      }
    }
    // collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      if (rectIntersect(player, stars[i])) {
        score++;
        playCollectSound();
        stars.splice(i, 1);
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#e0f7fa');
    bgGrad.addColorStop(1, '#80deea');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw player as a rounded circle
    ctx.fillStyle = '#0a84ff';
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();

    // draw obstacles with type-specific shapes
    for (const o of obstacles) {
      ctx.fillStyle = '#ff3b30';
      if (o.type === 'spike') {
        // triangle spike
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w/2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        // wall – rectangle
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    }

    // draw stars as 5‑pointed stars
    ctx.fillStyle = '#ffd60a';
    for (const s of stars) {
      drawStar(s.x + s.w/2, s.y + s.h/2, s.w/2, s.w/4, 5);
    }

    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  // helper to draw a star shape
  function drawStar(cx, cy, outerRadius, innerRadius, points) {
    const step = Math.PI / points;
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = i * step - Math.PI / 2;
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.1);
    }, duration);
  }
  function playJumpSound() { playBeep(400, 100); }
  function playCollectSound() { playBeep(800, 80); }
  function playGameOverSound() { playBeep(200, 300); }

  // input handling – simple tap/click for jump
  canvas.addEventListener('pointerdown', () => {
    if (player.onGround && !gameOver) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    }
    if (gameOver) {
      // reset game
      obstacles.length = 0;
      stars.length = 0;
      score = 0;
      frame = 0;
      player.y = height - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
      gameOver = false;
      requestAnimationFrame(loop);
    }
  });

  // start
  requestAnimationFrame(loop);
})();
