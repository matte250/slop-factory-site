// Minimal endless runner implementation for canvas with id "game"
// Pixel Runner – a tiny endless runner (see IDEA.md)

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // No canvas found
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 400);
  const H = (canvas.height = canvas.offsetHeight || 200);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playGameOverSound() { playTone(150, 0.4); }

  // Game state
  let score = 0;
  let frame = 0;
  const groundY = H * 0.8;
  const gravity = 0.6;
  const jumpVel = -10;

  const player = {
    x: 50,
    y: groundY - 20,
    w: 20,
    h: 20,
    vy: 0,
    onGround: true,
  };

  const obstacles = [];
  const obstacleFreq = 120; // frames between obstacles

  // Simple clouds for visual depth
  const clouds = [];
  const cloudFreq = 200; // frames between clouds

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({
      x: W,
      y: groundY - size,
      w: size,
      h: size,
    });
  }

  function spawnCloud() {
    const w = 30 + Math.random() * 40;
    const h = w * 0.6;
    clouds.push({
      x: W,
      y: 20 + Math.random() * 40,
      w,
      h,
      speed: 1 + Math.random() * 1,
    });
  }

  function update() {
    frame++;
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // speed
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Clouds movement
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) clouds.splice(i, 1);
    }

    // Spawn obstacles & clouds
    if (frame % obstacleFreq === 0) spawnObstacle();
    if (frame % cloudFreq === 0) spawnCloud();

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        cancelAnimationFrame(rAF);
        playGameOverSound();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('Game Over', W / 2 - 50, H / 2);
        ctx.fillText('Score: ' + Math.floor(score), W / 2 - 55, H / 2 + 30);
        return;
      }
    }

    score += 0.1;
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#87ceeb'); // sky blue
    grad.addColorStop(1, '#b0e0e6'); // lighter near horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGround() {
    ctx.fillStyle = '#4a2c2a';
    ctx.fillRect(0, groundY, W, H - groundY);
    // simple ground texture lines
    ctx.strokeStyle = '#3b221f';
    ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 10, groundY + 5);
      ctx.stroke();
    }
  }

  function drawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer() {
    // simple 3‑D shading for pixel hero
    ctx.fillStyle = '#ffdd55';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = '#bb8b00';
    ctx.fillRect(player.x, player.y + player.h - 5, player.w, 5); // bottom shade
  }

  function drawObstacles() {
    ctx.fillStyle = '#c33';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  function draw() {
    drawBackground();
    drawClouds();
    drawGround();
    drawPlayer();
    drawObstacles();
    // Score text
    ctx.fillStyle = '#000';
    ctx.font = '14px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop() {
    update();
    draw();
    rAF = requestAnimationFrame(loop);
  }

  function jump() {
    if (player.onGround) {
      player.vy = jumpVel;
      player.onGround = false;
      playJumpSound();
    }
  }
  canvas.addEventListener('click', jump);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
  });

  let rAF = requestAnimationFrame(loop);
})();
