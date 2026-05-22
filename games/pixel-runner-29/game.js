// Enhanced endless runner with gradient background, ground, clouds, and rounded player
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const groundHeight = 20;
  const player = { x: 50, y: canvas.height - groundHeight - 40, w: 40, h: 40, vy: 0, gravity: 0.6, jumpStrength: -12, onGround: true };
  const obstacles = [];
  const clouds = [];
  let frame = 0;
  let score = 0;
  let playing = true;

  const spawnObstacle = () => {
    const size = 30 + Math.random() * 30;
    const color = `hsl(${Math.random()*360},70%,60%)`;
    obstacles.push({ x: canvas.width, y: canvas.height - groundHeight - size, w: size, h: size, speed: 6, color });
  };

  const spawnCloud = () => {
    const radius = 20 + Math.random()*30;
    const y = 20 + Math.random()*(canvas.height/3);
    const speed = 1 + Math.random()*0.5;
    clouds.push({ x: canvas.width, y, radius, speed });
  };

  const reset = () => {
    obstacles.length = 0;
    clouds.length = 0;
    player.y = canvas.height - groundHeight - player.h;
    player.vy = 0;
    player.onGround = true;
    frame = 0;
    score = 0;
    playing = true;
    requestAnimationFrame(loop);
  };

  const handleInput = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
    }
  };

  window.addEventListener('keydown', e => { if (e.code === 'Space') handleInput(); });
  canvas.addEventListener('click', () => { if (!playing) reset(); else handleInput(); });

  const loop = () => {
    if (!playing) return;

    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#87ceeb'); // sky
    bg.addColorStop(1, '#b0e0e6'); // lighter bottom
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // clouds
    if (frame % 150 === 0) spawnCloud();
    ctx.fillStyle = '#fff';
    clouds.forEach((c, i) => {
      c.x -= c.speed;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      if (c.x + c.radius < 0) clouds.splice(i, 1);
    });

    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    // Update player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.h >= canvas.height - groundHeight) {
      player.y = canvas.height - groundHeight - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // draw player as rounded rect
    ctx.fillStyle = '#0b79d0';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 8);
    ctx.fill();

    // spawn obstacles
    if (frame % 90 === 0) spawnObstacle();
    frame++;

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // collision
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playing = false;
        ctx.font = '48px sans-serif';
        ctx.fillStyle = '#000';
        ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
        ctx.fillText('Score: ' + score, canvas.width / 2 - 80, canvas.height / 2 + 60);
        ctx.fillText('Click to Restart', canvas.width / 2 - 150, canvas.height / 2 + 120);
        break;
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Score display
    score = Math.floor(frame / 10);
    ctx.fillStyle = '#000';
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + score, 20, 40);

    if (playing) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const player = { x: 50, y: canvas.height - 60, w: 40, h: 40, vy: 0, gravity: 0.6, jumpStrength: -12, onGround: true };
  const obstacles = [];
  let frame = 0;
  let score = 0;
  let playing = true;

  const spawnObstacle = () => {
    const size = 30 + Math.random() * 30;
    obstacles.push({ x: canvas.width, y: canvas.height - size, w: size, h: size, speed: 6 });
  };

  const reset = () => {
    obstacles.length = 0;
    player.y = canvas.height - 60;
    player.vy = 0;
    player.onGround = true;
    frame = 0;
    score = 0;
    playing = true;
    requestAnimationFrame(loop);
  };

  const handleInput = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
    }
  };

  window.addEventListener('keydown', e => { if (e.code === 'Space') handleInput(); });
  canvas.addEventListener('click', () => { if (!playing) reset(); else handleInput(); });

  const loop = () => {
    if (!playing) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update player
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.h >= canvas.height) {
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    ctx.fillStyle = '#0b79d0';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Spawn obstacles
    if (frame % 90 === 0) spawnObstacle();
    frame++;

    // Update obstacles
    ctx.fillStyle = '#d00';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // Collision
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playing = false;
        ctx.font = '48px sans-serif';
        ctx.fillStyle = '#000';
        ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
        ctx.fillText('Score: ' + score, canvas.width / 2 - 80, canvas.height / 2 + 60);
        ctx.fillText('Click to Restart', canvas.width / 2 - 150, canvas.height / 2 + 120);
        break;
      }
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Score
    score = Math.floor(frame / 10);
    ctx.fillStyle = '#000';
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + score, 20, 40);

    if (playing) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
