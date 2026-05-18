// Simple endless runner targeting canvas with id="game"
// Author: generated from IDEA.md

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { beep(500, 0.08); }
  function playSlideSound() { beep(300, 0.08); }
  function playHitSound() { beep(150, 0.3); }
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 400;

  // Game state
  let lastTime = 0;
  let speed = 200; // pixels per second
  let score = 0;
  let gameOver = false;

  // Player
  const player = {
    x: 80,
    y: HEIGHT - 60,
    width: 40,
    height: 40,
    vy: 0,
    gravity: 1500,
    jumpStrength: -600,
    grounded: true,
    slide: false,
    slideTimer: 0,
  };

  function reset() {
    player.y = HEIGHT - 60;
    player.vy = 0;
    player.grounded = true;
    player.slide = false;
    player.slideTimer = 0;
    obstacles.length = 0;
    speed = 200;
    score = 0;
    gameOver = false;
    lastTime = 0;
  }

  // Obstacles
  const obstacles = [];
  // Starfield
  const stars = [];
  function initStars(count = 80) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        speed: 20 + Math.random() * 30,
        brightness: Math.random()
      });
    }
  }
  initStars();
  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'block';
    const w = 30;
    const h = type === 'spike' ? 30 : 60;
    const y = type === 'spike' ? HEIGHT - h : HEIGHT - h - 20;
    obstacles.push({x: WIDTH, y, width: w, height: h, type});
  }

  let spawnTimer = 0;
  const SPAWN_INTERVAL = 1.2; // seconds

  // Input handling: tap/click or space for jump, down arrow for slide
  function handleKey(e) {
    if (gameOver) return reset();
    if (e.type === 'keydown') {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        if (player.grounded) {
          player.vy = player.jumpStrength;
          player.grounded = false;
          playJumpSound();
        }
      } else if (e.key === 'ArrowDown') {
        if (!player.slide) {
          player.slide = true;
          player.height = 20;
          player.y += 20;
          player.slideTimer = 0.5; // seconds
          playSlideSound();
        }
      }
    }
  }

  window.addEventListener('keydown', handleKey);
  window.addEventListener('mousedown', handleKey);

  function update(dt) { // Move stars for parallax effect
  // Update stars positions
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.x -= s.speed * dt;
    if (s.x < 0) {
      s.x = WIDTH;
      s.y = Math.random() * HEIGHT;
      s.speed = 20 + Math.random() * 30;
      s.brightness = Math.random();
    }
  }
    // Update player
    if (!player.grounded) {
      player.vy += player.gravity * dt;
      player.y += player.vy * dt;
      if (player.y >= HEIGHT - 60) {
        player.y = HEIGHT - 60;
        player.vy = 0;
        player.grounded = true;
      }
    }
    if (player.slide) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) {
        player.slide = false;
        player.height = 40;
        player.y -= 20;
      }
    }

    // Spawn obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = SPAWN_INTERVAL;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed * dt;
      // Collision
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        playHitSound();
        gameOver = true;
      }
      // Remove off‑screen
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
        score++;
        // Increase speed gradually
        speed += 5;
      }
    }
  }

  function draw() {
    // Clear and draw moving starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Stars (simple twinkling)
    stars.forEach(star => {
      ctx.fillStyle = star.brightness > 0.5 ? '#fff' : '#888';
      ctx.fillRect(star.x, star.y, 2, 2);
    });
    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, HEIGHT - 100, 0, HEIGHT);
    groundGrad.addColorStop(0, '#3a3a3a');
    groundGrad.addColorStop(1, '#111');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HEIGHT - 100, WIDTH, 100);
    // Player – draw as a rounded rectangle (more friendly look)
    ctx.fillStyle = '#0f0';
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.width - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + radius);
    ctx.lineTo(player.x + player.width, player.y + player.height - radius);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height);
    ctx.lineTo(player.x + radius, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // Obstacles – spikes as triangles, blocks as rounded rects
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.height);
        ctx.lineTo(o.x + o.width / 2, o.y);
        ctx.lineTo(o.x + o.width, o.y + o.height);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#f00';
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(o.x + r, o.y);
        ctx.lineTo(o.x + o.width - r, o.y);
        ctx.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + r);
        ctx.lineTo(o.x + o.width, o.y + o.height - r);
        ctx.quadraticCurveTo(o.x + o.width, o.y + o.height, o.x + o.width - r, o.y + o.height);
        ctx.lineTo(o.x + r, o.y + o.height);
        ctx.quadraticCurveTo(o.x, o.y + o.height, o.x, o.y + o.height - r);
        ctx.lineTo(o.x, o.y + r);
        ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
        ctx.closePath();
        ctx.fill();
      }
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
