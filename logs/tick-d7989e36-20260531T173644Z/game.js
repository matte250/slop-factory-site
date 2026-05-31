// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');

  // set canvas size to fill its container or window
  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
    generateStars();
  };
  window.addEventListener('resize', resize);
  resize();
  // initial starfield
  generateStars();

  // --- Sound setup ---
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/beatbox.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  const crashSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/alert.wav');
  let soundStarted = false;
  const startSounds = () => {
    if (!soundStarted) {
      bgMusic.play();
      soundStarted = true;
    }
  };
  window.addEventListener('keydown', startSounds);


  // Player ship (simple triangle)
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    size: 30,
    speed: 5,
  };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  let startTime = performance.now();
  let gameOver = false;

  const drawPlayer = () => {
    // ship with glow effect
    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size / 2);
    ctx.lineTo(player.x - player.size / 2, player.y + player.size / 2);
    ctx.lineTo(player.x + player.size / 2, player.y + player.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const spawnAsteroid = () => {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -radius, radius, speed });
  };

  const updateAsteroids = (delta) => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * delta * 0.06; // adjust speed factor
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
    }
  };

  const drawAsteroids = () => {
    asteroids.forEach(a => {
      // radial gradient for depth effect
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#ff9966'); // bright core
      grad.addColorStop(1, '#663300'); // dark edge
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const rectCircleCollide = (rect, circle) => {
    const distX = Math.abs(circle.x - rect.x);
    const distY = Math.abs(circle.y - rect.y);
    if (distX > (rect.w / 2 + circle.r)) return false;
    if (distY > (rect.h / 2 + circle.r)) return false;
    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
  };

  const checkCollisions = () => {
    const shipRect = { x: player.x, y: player.y, w: player.size, h: player.size, r: 0 };
    for (const a of asteroids) {
      if (rectCircleCollide(shipRect, { x: a.x, y: a.y, r: a.radius })) {
        gameOver = true;
        // play crash sound and stop background music
        crashSound.currentTime = 0;
        crashSound.play();
        bgMusic.pause();
        break;
      }
    }
  };

  const drawScore = () => {
    const elapsed = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 30);
  };

  const loop = (timestamp) => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
      return;
    }
    const delta = timestamp - (lastRender || timestamp);
    lastRender = timestamp;
    // draw background first
    drawBackground();
    // clear any leftover (background already fills)
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // player movement
    if (keys['ArrowLeft'] && player.x - player.size / 2 > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.size / 2 < canvas.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y - player.size / 2 > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y + player.size / 2 < canvas.height) player.y += player.speed;

    // spawn asteroids
    if (timestamp - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    updateAsteroids(delta);
    checkCollisions();
    drawAsteroids();
    drawPlayer();
    drawScore();

    requestAnimationFrame(loop);
  };
  let lastRender = null;
  requestAnimationFrame(loop);
})();
