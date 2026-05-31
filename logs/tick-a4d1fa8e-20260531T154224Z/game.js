// Simple endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 200;

  // Sound assets (provide your own audio files at these paths)
  const jumpSound = new Audio('jump.wav');
  const hitSound = new Audio('hit.wav');
  const bgMusic = new Audio('bg.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play().catch(() => {}); // ignore autoplay block

  const player = { x: 50, y: 150, size: 20, vy: 0, onGround: true };
  const gravity = 0.8;
  const jumpStrength = -12;
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  const clouds = [];
  const cloudFreq = 5000; // ms
  let lastCloud = 0;
  let lastObstacle = 0;
  let distance = 0;
  let gameOver = false;

  function spawnObstacle() {
    const height = 20 + Math.random() * 30;
    obstacles.push({ x: canvas.width, y: canvas.height - height, w: 20, h: height });
  }

  function spawnCloud() {
    const r = 15 + Math.random() * 20;
    const y = 20 + Math.random() * (canvas.height / 2);
    clouds.push({ x: canvas.width, y, r });
  }

  function reset() {
    player.y = 150;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    clouds.length = 0;
    distance = 0;
    lastObstacle = 0;
    lastCloud = 0;
    gameOver = false;
  }

  function update(dt) {
    if (gameOver) return;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.size >= canvas.height) {
      player.y = canvas.height - player.size;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // obstacles move left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= dt * 0.3; // speed
      // collision
      if (
        player.x < o.x + o.w &&
        player.x + player.size > o.x &&
        player.y < o.y + o.h &&
        player.y + player.size > o.y
      ) {
        if (!gameOver) {
          hitSound.currentTime = 0;
          hitSound.play().catch(() => {});
        }
        gameOver = true;
      }
      // remove off-screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // clouds move left
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= dt * 0.1; // slower than obstacles
      if (c.x + c.r < 0) clouds.splice(i, 1);
    }
    // spawn new obstacles
    if (performance.now() - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = performance.now();
    }
    // spawn new clouds
    if (performance.now() - lastCloud > cloudFreq) {
      spawnCloud();
      lastCloud = performance.now();
    }
    distance += dt * 0.3;
  }

  function draw() {
    // sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#87CEFA'); // slightly deeper
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw simple clouds (circles)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds && clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground with gradient
    const groundGrad = ctx.createLinearGradient(0, canvas.height - 10, 0, canvas.height);
    groundGrad.addColorStop(0, '#4B8B3B');
    groundGrad.addColorStop(1, '#3A5F35');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    // player as a circle with radial gradient
    const pGrad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 8,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    pGrad.addColorStop(0, '#6FFF6F');
    pGrad.addColorStop(1, '#0A7F0A');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // obstacles with a subtle colour variation
    obstacles.forEach(o => {
      const oGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      oGrad.addColorStop(0, '#C33');
      oGrad.addColorStop(1, '#700');
      ctx.fillStyle = oGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // score text with slight shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 20);
    ctx.shadowColor = 'transparent';

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // input
  function jump() {
    if (player.onGround && !gameOver) {
      player.vy = jumpStrength;
      player.onGround = false;
    } else if (gameOver) {
      reset();
    }
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  reset();
  loop();
})();
