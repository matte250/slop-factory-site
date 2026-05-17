// game.js – Canvas Dash (endless runner)
// Minimal implementation targeting the first <canvas> element on the page.

(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
  };
  window.addEventListener('resize', resize);
  resize();

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SPEED = 3; // px per frame
  const GROUND_Y = canvas.height / dpr - 50; // visual ground line

  // Player state
  const player = {
    x: 50,
    y: GROUND_Y - 15,
    radius: 15,
    vy: 0,
    onGround: true,
    jump() {
      if (this.onGround) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
      }
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      // simple ground collision (will be overridden by platforms)
      if (this.y + this.radius >= GROUND_Y) {
        this.y = GROUND_Y - this.radius;
        this.vy = 0;
        this.onGround = true;
      }
    },
    draw() {
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Platform generation – array of {x, width, gapAfter}
  const platforms = [];
  const segLength = 300; // base segment length
  function addPlatform(prevX) {
    const width = segLength + Math.random() * 200 - 100; // vary length
    const gap = Math.random() < 0.3 ? 50 + Math.random() * 100 : 30; // occasional larger gaps
    platforms.push({ x: prevX, width, gap });
    return prevX + width + gap;
  }
  // seed initial platforms covering first screen width + extra
  let cursor = 0;
  while (cursor < canvas.width / dpr * 3) {
    cursor = addPlatform(cursor);
  }

  // Obstacles and stars
  const obstacles = [];
  const stars = [];
  function spawnObstacle() {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const x = platform.x + Math.random() * platform.width;
    const y = GROUND_Y - 30;
    obstacles.push({ x, y, w: 20, h: 30 });
  }
  function spawnStar() {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const x = platform.x + Math.random() * platform.width;
    const y = GROUND_Y - 80 - Math.random() * 40;
    stars.push({ x, y, r: 8, collected: false });
  }
  // initial spawns
  for (let i = 0; i < 5; i++) spawnObstacle();
  for (let i = 0; i < 8; i++) spawnStar();

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') player.jump();
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    player.jump();
  });

  let score = 0;
  let distance = 0;
  let gameOver = false;

  function checkCollision(rect) {
    // circle-rect collision
    const distX = Math.abs(player.x - rect.x - rect.w / 2);
    const distY = Math.abs(player.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + player.radius) return false;
    if (distY > rect.h / 2 + player.radius) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= player.radius * player.radius;
  }

  function update() {
    if (gameOver) return;
    // move world left relative to player speed
    const dx = PLAYER_SPEED;
    distance += dx;
    // update platforms
    platforms.forEach(p => (p.x -= dx));
    // recycle platforms off-screen
    while (platforms.length && platforms[0].x + platforms[0].width < -50) {
      platforms.shift();
    }
    // add new platform if needed
    if (platforms.length) {
      const last = platforms[platforms.length - 1];
      const rightEdge = last.x + last.width + last.gap;
      while (rightEdge < canvas.width / dpr * 2) {
        cursor = addPlatform(rightEdge);
        break;
      }
    }
    // update player
    // simple ground from platforms: find platform under player
    player.onGround = false;
    const footX = player.x;
    const footY = GROUND_Y; // default ground line
    for (const p of platforms) {
      if (footX >= p.x && footX <= p.x + p.width) {
        const platformY = GROUND_Y - 0; // flat ground level
        if (player.y + player.radius >= platformY) {
          player.y = platformY - player.radius;
          player.vy = 0;
          player.onGround = true;
        }
        break;
      }
    }
    player.update();
    // obstacles
    obstacles.forEach(o => (o.x -= dx));
    obstacles.filter(o => o.x + o.w > -50).forEach(o => {
      if (checkCollision(o)) gameOver = true;
    });
    // stars
    stars.forEach(s => (s.x -= dx));
    stars.forEach(s => {
      if (!s.collected && Math.hypot(player.x - s.x, player.y - s.y) < player.radius + s.r) {
        s.collected = true;
        score += 10;
      }
    });
    // cleanup off‑screen obstacles/stars
    obstacles.splice(0, obstacles.findIndex(o => o.x + o.w > -50));
    stars.splice(0, stars.findIndex(s => s.x > -50 && s.collected));
    // occasional spawns
    if (Math.random() < 0.02) spawnObstacle();
    if (Math.random() < 0.03) spawnStar();
    // increase score with distance
    score = Math.floor(distance / 10) + score;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    // draw ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, GROUND_Y, canvas.width / dpr, canvas.height / dpr - GROUND_Y);
    // draw platforms (as gaps are just empty space)
    ctx.fillStyle = '#654321';
    platforms.forEach(p => {
      ctx.fillRect(p.x, GROUND_Y - 10, p.width, 10);
    });
    // obstacles
    ctx.fillStyle = '#222';
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y - o.h, o.w, o.h);
    });
    // stars
    stars.forEach(s => {
      if (!s.collected) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // player
    player.draw();
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / dpr / 2 - 80, canvas.height / dpr / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
