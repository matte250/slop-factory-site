// Simple Meteor Dodge game
// Canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // audio assets (tiny beep & explosion sounds)
  const soundScore = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');
  const soundGameOver = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');

  // ship
  const ship = { x: canvas.width / 2, y: canvas.height - 40, w: 30, h: 30, speed: 5 };
// meteors and stars
    const meteors = [];
    const stars = [];
    initStars();
    // initialize starfield
    function initStars() {
      const count = 100;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          brightness: Math.random() * 0.5 + 0.5
        });
      }
    }
  const meteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  // score
  let score = 0;
  let gameOver = false;

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnMeteor() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (canvas.width - size);
    const speed = Math.random() * 2 + 1;
    meteors.push({ x, y: -size, w: size, h: size, speed });
  }

  function update(dt) {
    if (gameOver) return;
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep in bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // meteors
    meteors.forEach(m => (m.y += m.speed));
    // stars parallax (slow downward movement)
    stars.forEach(s => {
      s.y += 0.3; // subtle movement
      if (s.y > canvas.height) s.y = 0;
    });
    // remove off‑screen meteors
    while (meteors.length && meteors[0].y > canvas.height) {
      meteors.shift();
      score++;
      // play score sound
      if (soundScore) soundScore.currentTime = 0, soundScore.play();
    }
    // collision detection
    for (const m of meteors) {
      if (
        ship.x < m.x + m.w &&
        ship.x + ship.w > m.x &&
        ship.y < m.y + m.h &&
        ship.y + ship.h > m.y
      ) {
        soundGameOver.currentTime = 0; soundGameOver.play(); gameOver = true;
        break;
      }
    }
    // spawn timing
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.brightness;
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.globalAlpha = 1;
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // meteors (gradient circles)
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        0,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#ff8c00');
      grad.addColorStop(1, '#8b0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
