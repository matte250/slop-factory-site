// Astro Dash - simple endless canvas game
// Assumes an existing <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;
  // Sound assets
  const thrustSound = new Audio('https://cdn.jsdelivr.net/gh/ericfischer/asteroids-sfx/thrust.wav');
  const crashSound = new Audio('https://cdn.jsdelivr.net/gh/ericfischer/asteroids-sfx/crash.wav');
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/ericfischer/asteroids-sfx/background.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  // Start music after first user interaction (key press)
  let musicStarted = false;

  // Ship
  const ship = { x: width / 2, y: height - 60, w: 30, h: 30, speed: 4 };

  // Obstacles
  const obstacles = [];
  const obstacleSpawnRate = 90; // frames
  // Starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  let frameCount = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Start background music on first interaction
    if (!musicStarted) {
      musicStarted = true;
      bgMusic.play();
    }
    // Play thrust sound when moving up
    if ((e.key === 'ArrowUp' || e.key === 'w') && !thrustSound.paused) {
      // already playing
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
      thrustSound.currentTime = 0;
      thrustSound.play();
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 3 });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Update starfield (scroll downwards)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Spawn obstacles
    if (frameCount % obstacleSpawnRate === 0) spawnObstacle();
    frameCount++;

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Remove off‑screen
      if (o.y > height) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // Collision detection
    for (const o of obstacles) {
      if (ship.x < o.x + o.w && ship.x + ship.w > o.x && ship.y < o.y + o.h && ship.y + ship.h > o.y) {
        gameOver = true;
        // Play crash sound and stop music
        crashSound.currentTime = 0;
        crashSound.play();
        bgMusic.pause();
        break;
      }
    }
  }

  function draw() {
    // Clear and draw background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship (gradient triangle with thrust)
    const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGradient.addColorStop(0, '#00ffff');
    shipGradient.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when moving up
    if (keys.ArrowUp || keys.w) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.w / 2, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w / 2 - 5, ship.y + ship.h + 10);
      ctx.lineTo(ship.x + ship.w / 2 + 5, ship.y + ship.h + 10);
      ctx.closePath();
      ctx.fill();
    }
    // Obstacles - draw as gradient circles
    for (const o of obstacles) {
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w/4, o.x + o.w/2, o.y + o.h/2, o.w/2);
      grad.addColorStop(0, '#ff6b6b');
      grad.addColorStop(1, '#c0392b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
