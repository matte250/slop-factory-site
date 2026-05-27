// Simple Neon Drift endless runner with enhanced neon graphics
// Canvas element with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Sound assets
  const bgMusic = new Audio('https://actions.google.com/sounds/v1/ambiences/space_ambient.ogg');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  const crashSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
  let musicStarted = false;

  // Player ship
  const ship = {
    trail: [],
    x: width / 2,
    y: height - 60,
    w: 40,
    h: 20,
    speed: 5,
    color: '#0ff',
  };

  // Obstacles array
  const obstacles = [];
  const obstacleFreq = 1500; // ms between spawns
  const obstacleSpeed = 2; // pixels per frame

  // Starfield for background
  const stars = [];
  const starCount = 100;
  const maxStarSpeed = 0.5;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        speed: Math.random() * maxStarSpeed + 0.1,
      });
    }
  }
  initStars();

  let lastSpawn = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
  });

  function getNeonColor() {
    // Returns a bright neon color using HSL
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 50%)`;
  }

function spawnObstacle() {
    const w = 40 + Math.random() * 40; // width 40-80
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -20, w, h: 20, color: getNeonColor() });
  }

  function update(dt) {
    // player movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep within bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.w > width) ship.x = width - ship.w;

    // spawn obstacles
    if (performance.now() - lastSpawn > obstacleFreq) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      // remove off‑screen
      if (o.y > height) obstacles.splice(i, 1);
    }

    // collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        gameOver = true;
        if (musicStarted) {
          bgMusic.pause();
        }
        crashSound.play();
        break;
      }
    }
  }

  function draw() {
    // Neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ship trail (fading particles)
    ship.trail.push({ x: ship.x + ship.w / 2, y: ship.y + ship.h, life: 30 });
    for (let i = ship.trail.length - 1; i >= 0; i--) {
      const p = ship.trail[i];
      p.life--;
      if (p.life <= 0) ship.trail.splice(i, 1);
      else {
        const alpha = p.life / 30;
        ctx.fillStyle = `rgba(0,255,255,${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ship with neon glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = ship.color;
    ctx.fillStyle = ship.color;
    ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
    ctx.shadowBlur = 0;

    // obstacles with gradient neon
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      grad.addColorStop(0, o.color);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!musicStarted) {
      bgMusic.play().catch(() => {});
      musicStarted = true;
    }
    if (gameOver) {
      draw();
      return;
    }
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
