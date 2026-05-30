// Meteor Dodge game implementation
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Star field for background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }

  // Audio assets (place files in same directory)
  const bgMusic = new Audio('background.mp3');
  bgMusic.loop = true;
  const collisionSound = new Audio('collision.wav');
  let musicStarted = false;

  // Player ship
  const ship = {
    width: 40,
    height: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 5,
    color: '#0ff'
  };

  // Meteor pool
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    const size = Math.random() * 30 + 10;
    meteors.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      size,
      speed: 2 + Math.random() * 3,
      color: '#f55'
    });
  }

  function update(dt) {
    // Start background music on first user interaction
    if (!musicStarted && (keys.ArrowLeft || keys.ArrowRight || keys.a || keys.d)) {
      bgMusic.play().catch(() => {});
      musicStarted = true;
    }
    // Move stars down to create scrolling effect
    for (let s of stars) {
      s.y += 0.3; // slow speed
      if (s.y > HEIGHT) {
        s.x = Math.random() * WIDTH;
        s.y = 0;
        s.radius = Math.random() * 1.5 + 0.5;
        s.alpha = Math.random() * 0.5 + 0.5;
      }
    }
    // Move ship
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(WIDTH - ship.width, ship.x));

    // Spawn meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off‑screen meteors
      if (m.y > HEIGHT) meteors.splice(i, 1);
      // Collision detection (simple AABB)
      if (
        ship.x < m.x + m.size &&
        ship.x + ship.width > m.x &&
        ship.y < m.y + m.size &&
        ship.y + ship.height > m.y
      ) {
        collisionSound.play();
        bgMusic.pause();
        gameOver = true;
      }
    }

    // Score = time survived in seconds
    score = Math.floor((performance.now() - startTime) / 1000);
  }

function draw() {
    // Clear with space color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw star field
    for (let s of stars) {
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (draw as triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Meteors
    meteors.forEach(m => {
      // Meteor with radial gradient for glowing effect
      const gradient = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.1,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      gradient.addColorStop(0, 'rgba(255,200,200,0.9)');
      gradient.addColorStop(1, 'rgba(150,0,0,0.7)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  const startTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
