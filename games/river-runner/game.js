// Minimal side‑scroll river runner game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Sounds
  const coinSound = new Audio('https://www.soundjay.com/button/sounds/button-16.mp3');
  const crashSound = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');
  // Boat (player)
  const boat = {
    x: 80,
    y: height / 2 - 15,
    w: 30,
    h: 30,
    speedX: 0,
    speedY: 0,
    maxSpeed: 3,
    color: '#0077ff',
  };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles and coins
  const obstacles = [];
  const coins = [];
  let obstacleTimer = 0;
  let coinTimer = 0;
  let score = 0;
  let gameOver = false;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnObstacle = () => {
    const size = rand(20, 50);
    obstacles.push({
      x: width,
      y: rand(0, height - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
      color: '#8B4513', // brown rock
    });
  };

  const spawnCoin = () => {
    const size = 15;
    coins.push({
      x: width,
      y: rand(0, height - size),
      r: size / 2,
      speed: 2,
      color: '#FFD700', // gold
    });
  };

  const rectCollision = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const circleRectCollision = (circle, rect) => {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  };

  const update = (dt) => {
    if (gameOver) return;
    // Boat control
    boat.speedX = 0; boat.speedY = 0;
    if (keys.ArrowLeft) boat.speedX = -boat.maxSpeed;
    if (keys.ArrowRight) boat.speedX = boat.maxSpeed;
    if (keys.ArrowUp) boat.speedY = -boat.maxSpeed;
    if (keys.ArrowDown) boat.speedY = boat.maxSpeed;
    boat.x += boat.speedX;
    boat.y += boat.speedY;
    // Keep within canvas (lose if out of bounds)
    if (boat.x < 0 || boat.x + boat.w > width || boat.y < 0 || boat.y + boat.h > height) {
      gameOver = true;
    }
    // Move obstacles & remove off‑screen
    obstacleTimer += dt;
    if (obstacleTimer > 1500) { spawnObstacle(); obstacleTimer = 0; }
    obstacles.forEach(o => o.x -= o.speed);
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // Move coins & remove
    coinTimer += dt;
    if (coinTimer > 2000) { spawnCoin(); coinTimer = 0; }
    coins.forEach(c => c.x -= c.speed);
    while (coins.length && coins[0].x + coins[0].r < 0) coins.shift();
    // Collision checks
    for (const o of obstacles) {
      if (rectCollision(boat, o)) { 
        if (!gameOver) crashSound.play();
        gameOver = true; break; 
      }
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (circleRectCollision({x: c.x, y: c.y, r: c.r}, boat)) {
        score += 10;
        coinSound.play();
        coins.splice(i, 1);
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // gradient water background
    const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
    waterGrad.addColorStop(0, '#6ec5ff');
    waterGrad.addColorStop(1, '#004e92');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, width, height);
    // draw boat as a simple triangle
    ctx.fillStyle = boat.color;
    ctx.beginPath();
    ctx.moveTo(boat.x, boat.y + boat.h / 2);
    ctx.lineTo(boat.x + boat.w, boat.y);
    ctx.lineTo(boat.x + boat.w, boat.y + boat.h);
    ctx.closePath();
    ctx.fill();
    // draw obstacles
    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // draw coins
    coins.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
