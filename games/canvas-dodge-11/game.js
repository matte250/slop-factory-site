// Canvas Dodge Game
// Targets a <canvas id="game"></canvas> in the containing HTML.
// Minimal implementation: player (circle), scrolling obstacles, jump/slide controls, score, speed increase.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playJumpSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 300;
    gain.gain.value = 0.1;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playGameOverSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.value = 0.2;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  // Ensure audio context is resumed on first user interaction (required by browsers)
  let audioInitialized = false;

  // Set canvas size to fill parent (can be adjusted in HTML/CSS)
  canvas.width = canvas.offsetWidth || 800;
  canvas.height = canvas.offsetHeight || 400;

  const GRAVITY = 0.6;
  // Background scroll offset for simple moving ground
  let bgOffset = 0;
  const JUMP_VELOCITY = -12;
  const PLAYER_RADIUS = 15;
  const PLAYER_X = 80; // fixed horizontal position

  let speed = 4; // base scroll speed, increases over time
  let speedIncreaseInterval = 5000; // ms
  let lastSpeedIncrease = 0;

  let score = 0;
  let gameOver = false;

  const player = {
    y: canvas.height - PLAYER_RADIUS,
    vy: 0,
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    radius: PLAYER_RADIUS,
    onGround: true,
    sliding: false,
  };

  const obstacles = [];
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_GAP = 200; // distance between obstacles
  let nextObstacleX = canvas.width + 100;

  // Input handling
  const keys = {};
  // Particle system for jump effect
  const particles = [];
  const MAX_PARTICLES = 30;
  window.addEventListener('keydown', (e) => {
    if (gameOver) return;
    if (e.code === 'Space' && player.onGround && !player.sliding) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
      // Spawn particles at player's feet
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: PLAYER_X,
          y: canvas.height - player.radius,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1,
          life: MAX_PARTICLES,
          size: Math.random() * 3 + 2,
        });
      }
    }
    if (e.code === 'ArrowDown') {
      player.sliding = true;
      // Reduce height for slide (make hitbox shorter)
      player.height = PLAYER_RADIUS; // half height
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') {
      player.sliding = false;
      player.height = PLAYER_RADIUS * 2;
    }
  });

  function spawnObstacle() {
    // Randomly decide obstacle type: spike (triangle) or block (rectangle)
    const type = Math.random() < 0.5 ? 'block' : 'spike';
    const height = type === 'block' ? PLAYER_RADIUS * 2 : PLAYER_RADIUS * 2;
    const obstacle = {
      x: canvas.width,
      y: canvas.height - height,
      width: OBSTACLE_WIDTH,
      height,
      type,
    };
    obstacles.push(obstacle);
  }

  function update(dt) {
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity for particles
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    // Update player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= canvas.height - player.radius) {
      player.y = canvas.height - player.radius;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;
      // Remove off-screen obstacles and increment score
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // Spawn new obstacles based on distance
    if (obstacles.length === 0 || (obstacles[obstacles.length - 1].x < canvas.width - OBSTACLE_GAP)) {
      spawnObstacle();
    }

    // Collision detection (simple AABB vs circle)
    for (const obs of obstacles) {
      const cx = PLAYER_X;
      const cy = player.y;
      const nearestX = Math.max(obs.x, Math.min(cx, obs.x + obs.width));
      const nearestY = Math.max(obs.y, Math.min(cy, obs.y + obs.height));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        gameOver = true;
        if (!audioInitialized) { audioCtx.resume(); audioInitialized = true; }
        playGameOverSound();
        break;
      }
    }

    // Speed increase over time
    const now = performance.now();
    if (now - lastSpeedIncrease > speedIncreaseInterval) {
      speed += 0.5;
      lastSpeedIncrease = now;
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87ceeb'); // light sky blue
    skyGrad.addColorStop(1, '#fff'); // near horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scrolling ground (simple pattern)
    const groundHeight = 40;
    ctx.fillStyle = '#2c3e50';
    // Update offset for motion
    bgOffset = (bgOffset - speed) % 20;
    for (let x = bgOffset; x < canvas.width; x += 20) {
      ctx.fillRect(x, canvas.height - groundHeight, 10, groundHeight);
    }

    // Draw player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(PLAYER_X, canvas.height - player.radius, player.radius * 1.2, player.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw jump particles
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,255,255,${p.life / MAX_PARTICLES})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player (circle) with radial gradient
    const playerGrad = ctx.createRadialGradient(PLAYER_X - 5, player.y - 5, player.radius / 2, PLAYER_X, player.y, player.radius);
    playerGrad.addColorStop(0, '#5dade2');
    playerGrad.addColorStop(1, '#2980b9');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(PLAYER_X, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles with varied colors
    for (const obs of obstacles) {
      if (obs.type === 'block') {
        ctx.fillStyle = '#c0392b'; // darker block
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      } else if (obs.type === 'spike') {
        ctx.fillStyle = '#e67e22'; // orange spike
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
