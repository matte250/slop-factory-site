// Minimal endless runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // Player
  const player = { x: 50, y: HEIGHT - 20 - 30, w: 30, h: 30, vy: 0, onGround: true }; // positioned above ground (ground height 20)
  const GRAVITY = 0.8;
  const JUMP = -15;

  // Obstacles and background elements
  const obstacles = [];
  let obstacleTimer = 0;
  const clouds = [];
  let cloudTimer = 0;
  let speed = 4;
  let score = 0;
  let gameOver = false;

  const rand = (min, max) => Math.random() * (max - min) + min;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    if (type === 'spike') {
      // spike: triangular obstacle from ground
      obstacles.push({ x: WIDTH, y: HEIGHT - 30, w: 30, h: 30, type: 'spike' });
    } else {
      // gap: solid block on ground to jump over
      obstacles.push({ x: WIDTH, y: HEIGHT - 30, w: 40, h: 30, type: 'gap' });
    }
  }

  function update() {
    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= HEIGHT - 20) { // ground height 20
      player.y = HEIGHT - 20 - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // Obstacles
    obstacleTimer -= 1;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = Math.round(rand(60, 120)); // frames till next obstacle
    }
    obstacles.forEach(o => o.x -= speed);
    // Clouds (parallax)
    cloudTimer -= 1;
    if (cloudTimer <= 0) {
      // spawn a cloud
      const cw = Math.round(rand(30, 80));
      const ch = Math.round(cw * 0.6);
      clouds.push({ x: WIDTH, y: Math.round(rand(20, HEIGHT / 2)), w: cw, h: ch });
      cloudTimer = Math.round(rand(120, 240));
    }
    clouds.forEach(c => c.x -= speed * 0.3);
    // Remove off‑screen clouds
    while (clouds.length && clouds[0].x + clouds[0].w < 0) {
      clouds.shift();
    }
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
      obstacles.shift();
      score++;
      speed *= 1.02; // gradual speed increase
    }
    // Collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        playGameOverSound();
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#87ceeb'); // sky
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI*2);
      ctx.fill();
    }
    // ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);
    // player with gradient circle
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w/2,
      player.y + player.h/2,
      5,
      player.x + player.w/2,
      player.y + player.h/2,
      player.w/2
    );
    playerGrad.addColorStop(0, '#00ff00');
    playerGrad.addColorStop(1, '#006400');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();
    // obstacles with styles
    for (const o of obstacles) {
      if (o.type === 'spike') {
        // draw a triangle spike
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else if (o.type === 'gap') {
        // draw a gap as a dark block on ground
        ctx.fillStyle = '#222';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      } else {
        // fallback solid obstacle
        ctx.fillStyle = '#f00';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 80, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playGameOverSound() { playTone(150, 0.4); }

  // Input
  canvas.addEventListener('click', () => {
    if (player.onGround) {
      player.vy = JUMP;
      playJumpSound();
    }
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (player.onGround) {
      player.vy = JUMP;
      playJumpSound();
    }
  }, { passive: false });

  // start
  requestAnimationFrame(loop);
})();
