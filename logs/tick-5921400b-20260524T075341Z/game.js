// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // Audio assets
  const soundCollect = new Audio('https://www.soundjay.com/button/sounds/button-16.mp3');
  const soundHit = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');
  const soundBg = new Audio('https://www.soundjay.com/ambient/sounds/space-ambient-2.mp3');
  soundBg.loop = true;
  // Start background after first user interaction
  const startAudio = () => { soundBg.play(); window.removeEventListener('keydown', startAudio); };
  window.addEventListener('keydown', startAudio);


  // Player definition
  const player = {
    w: 40,
    h: 40,
    x: width / 2 - 20,
    y: height - 60,
    speed: 5,
    color: '#0ff'
  };

  const obstacles = [];
  const orbs = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const size = 30 + Math.random() * 30;
    obstacles.push({
      w: size,
      h: size,
      x: Math.random() * (width - size),
      y: -size,
      speed: 2 + Math.random() * 3,
      color: '#f44'
    });
  }

  function spawnOrb() {
    const r = 8 + Math.random() * 8;
    orbs.push({
      r,
      x: Math.random() * (width - 2 * r) + r,
      y: -r,
      speed: 2 + Math.random() * 2,
      color: '#ff0'
    });
  }

  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectCollision(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > (rect.w / 2 + circle.r)) return false;
    if (distY > (rect.h / 2 + circle.r)) return false;
    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
  }

  let obstacleTimer = 0;
  let orbTimer = 0;

  function update(delta) {
    if (gameOver) return;
    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Spawn obstacles/orbs
    obstacleTimer += delta;
    orbTimer += delta;
    if (obstacleTimer > 1500) { spawnObstacle(); obstacleTimer = 0; }
    if (orbTimer > 1000) { spawnOrb(); orbTimer = 0; }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (rectCollision(player, o)) { soundHit.currentTime = 0; soundHit.play(); gameOver = true; }
      if (o.y > height) obstacles.splice(i, 1);
    }

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.y += orb.speed;
      if (circleRectCollision(orb, player)) {
        score += 10;
        soundCollect.currentTime = 0;
        soundCollect.play();
        orbs.splice(i, 1);
      } else if (orb.y - orb.r > height) {
        orbs.splice(i, 1);
      }
    }
  }

  function draw() {
    // Draw moving starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      // Move star downwards for parallax effect
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });

    // Player with neon glow
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();

    // Obstacles with gradient fill
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#f66');
      grad.addColorStop(1, '#900');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Orbs with glow effect
    orbs.forEach(orb => {
      ctx.save();
      ctx.fillStyle = orb.color;
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const delta = now - last;
    last = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
