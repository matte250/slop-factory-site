// Simple endless runner for canvas with id "game"
// Controls: Space or ArrowUp to jump

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 200;

  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 30;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 1500; // ms between obstacles
  const STAR_SIZE = 15;

  // visual enhancements
  const SKY_GRADIENT = ctx.createLinearGradient(0, 0, 0, canvas.height);
  SKY_GRADIENT.addColorStop(0, '#74c0fc'); // light blue
  SKY_GRADIENT.addColorStop(1, '#d0ebff'); // pale sky
  const GROUND_COLOR = '#4d4d4d';
  const CLOUD_COLOR = '#ffffff88';
  const CLOUDS = [];
  let cloudTimer = 0;

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  let score = 0;
  let gameOver = false;
  let lastObstacleTime = 0;
  let lastStarTime = 0;

  const player = {
    x: 50,
    y: canvas.height - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    jumping: false,
    draw() {
      // draw player as a gradient circle
      const grad = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 4,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      grad.addColorStop(0, '#00f');
      grad.addColorStop(1, '#0af');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.height > canvas.height) {
        this.y = canvas.height - this.height;
        this.vy = 0;
        this.jumping = false;
      }
    },
  };

  const obstacles = [];
  const stars = [];

  function spawnObstacle() {
    obstacles.push({
      x: canvas.width,
      y: canvas.height - OBSTACLE_WIDTH,
      width: OBSTACLE_WIDTH,
      height: OBSTACLE_WIDTH,
    });
  }

  function spawnStar() {
    stars.push({
      x: canvas.width,
      y: canvas.height - PLAYER_SIZE - 80,
      size: STAR_SIZE,
    });
  }

  function rectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function pointInRect(px, py, rect) {
    return px > rect.x && px < rect.x + rect.width && py > rect.y && py < rect.y + rect.height;
  }

  function update(dt) {
    if (gameOver) return;
    player.update();
    // move obstacles and stars
    obstacles.forEach(o => o.x -= 6);
    stars.forEach(s => s.x -= 6);
    // move clouds (slower for parallax)
    CLOUDS.forEach(c => c.x -= 2);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].width < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].size < 0) stars.shift();
    while (CLOUDS.length && CLOUDS[0].x + CLOUDS[0].w < 0) CLOUDS.shift();
    // collision detection
    for (const o of obstacles) {
      if (rectCollision(player, o)) { gameOver = true; playTone(200, 0.4); break; }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (pointInRect(s.x, s.y, player)) {
        score += 10;
        stars.splice(i, 1);
        playTone(660, 0.1);
      }
    }
    // spawn logic
    const now = performance.now();
    if (now - lastObstacleTime > OBSTACLE_GAP) { spawnObstacle(); lastObstacleTime = now; }
    if (now - lastStarTime > 2000) { spawnStar(); lastStarTime = now; }
    // spawn clouds every 3 seconds
    if (now - cloudTimer > 3000) {
      CLOUDS.push({
        x: canvas.width + 20,
        y: Math.random() * (canvas.height * 0.4),
        w: 60 + Math.random() * 40,
        h: 20 + Math.random() * 15,
      });
      cloudTimer = now;
    }
    score += dt * 0.01;
  }

  function draw() {
    // sky background
    ctx.fillStyle = SKY_GRADIENT;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // clouds (simple ellipses moving left)
    CLOUDS.forEach(c => {
      ctx.fillStyle = CLOUD_COLOR;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.h, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // ground
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, canvas.height - 5, canvas.width, 5);
    // player
    player.draw();
    // obstacles (draw as dark rectangles with rounded corners)
    ctx.fillStyle = '#222';
    obstacles.forEach(o => {
      ctx.beginPath();
      const r = 4;
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.width - r, o.y);
      ctx.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + r);
      ctx.lineTo(o.x + o.width, o.y + o.height - r);
      ctx.quadraticCurveTo(o.x + o.width, o.y + o.height, o.x + o.width - r, o.y + o.height);
      ctx.lineTo(o.x + r, o.y + o.height);
      ctx.quadraticCurveTo(o.x, o.y + o.height, o.x, o.y + o.height - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.fill();
    });
    // stars (draw as small glowing circles)
    ctx.fillStyle = '#ff0';
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(s.x + s.size/2, s.y + s.size/2, 0, s.x + s.size/2, s.y + s.size/2, s.size);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + s.size/2, s.y + s.size/2, s.size/2, 0, Math.PI*2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }

  function loop(ts) {
    if (!prev) prev = ts;
    const dt = ts - prev;
    prev = ts;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let prev;
  // input
  window.addEventListener('keydown', e => {
    // ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !player.jumping) {
      player.vy = JUMP_SPEED;
      player.jumping = true;
      playTone(440, 0.2); // jump sound
    }
    if (gameOver && e.code === 'Enter') {
      // restart
      obstacles.length = 0;
      stars.length = 0;
      score = 0;
      gameOver = false;
      player.y = canvas.height - PLAYER_SIZE;
      player.vy = 0;
      requestAnimationFrame(loop);
    }
  });

  requestAnimationFrame(loop);
})();
