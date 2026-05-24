// Minimal endless‑runner based on IDEA.md
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Background stars (static)
  const bgStars = Array.from({length: 80}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 0.5 + Math.random() * 1.5,
    alpha: 0.5 + Math.random() * 0.5
  }));

  // Audio assets
  const collectSound = new Audio('https://www.soundjay.com/button/sounds/button-16.mp3');
  const crashSound = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');
  const bgMusic = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  // Attempt to play background music (may require user interaction)
  bgMusic.play().catch(() => {});
  let crashPlayed = false;

  // Player (dot)
  const player = { x: 50, y: height / 2, r: 8, speed: 2 };


  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles and stars
  const obstacles = [];
  const stars = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 12 + Math.random() * 8;
    obstacles.push({ x: width + size, y: Math.random() * (height - size), w: size, h: size, speed: 3 + Math.random() * 2 });
  }
  function spawnStar() {
    const r = 4 + Math.random() * 3;
    stars.push({ x: width + r, y: Math.random() * (height - r), r, speed: 2 });
  }

  function update() {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;

    // bounds check – end if outside
    if (player.x < 0 || player.x > width || player.y < 0 || player.y > height) {
      if (!crashPlayed) {
        crashSound.play();
        crashPlayed = true;
      }
      gameOver = true;
    }

    // move obstacles and stars
    obstacles.forEach(o => o.x -= o.speed);
    stars.forEach(s => s.x -= s.speed);
    // animate background stars (twinkle)
    bgStars.forEach(star => {
      star.alpha = 0.5 + Math.random() * 0.5;
    });
    // remove off‑screen obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }
    // remove off‑screen collectible stars
    for (let i = stars.length - 1; i >= 0; i--) {
      if (stars[i].x + stars[i].r < 0) stars.splice(i, 1);
    }
    // collision detection
    for (const o of obstacles) {
      if (player.x + player.r > o.x && player.x - player.r < o.x + o.w &&
          player.y + player.r > o.y && player.y - player.r < o.y + o.h) {
        gameOver = true;
        break;
      }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = player.x - s.x;
      const dy = player.y - s.y;
if (Math.hypot(dx, dy) < player.r + s.r) {
          score++;
          collectSound.play();
          stars.splice(i, 1);
        }
    }
    // spawn entities
    if (frames % 120 === 0) spawnObstacle();
    if (frames % 180 === 0) spawnStar();
    frames++;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // background twinkling stars
    bgStars.forEach(star => {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player with radial gradient
    const pGrad = ctx.createRadialGradient(player.x, player.y, player.r / 4, player.x, player.y, player.r);
    pGrad.addColorStop(0, '#0f0');
    pGrad.addColorStop(1, '#004');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // obstacles with rounded corners
    ctx.fillStyle = '#b00';
    obstacles.forEach(o => {
      const radius = 3;
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
      ctx.fill();
    });
    // stars (collectibles) with glow
    stars.forEach(s => {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // start
  requestAnimationFrame(loop);
})();
