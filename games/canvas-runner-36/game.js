// game.js – minimal endless runner based on IDEA.md

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');

  // Set canvas size – adjust as needed
  canvas.width = 800;
  canvas.height = 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SLIDE_DURATION = 300; // ms
  const OBSTACLE_INTERVAL = 1500; // ms between obstacles
  const OBSTACLE_SPEED = 4;
  const CLOUD_INTERVAL = 2500; // ms between clouds
  const CLOUD_SPEED = 1;
  const GROUND_INTERVAL = 1000; // ms between ground segments
  const GROUND_SPEED = OBSTACLE_SPEED; // sync with obstacle speed

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.2); }
  function playSlideSound() { playTone(220, 0.15); }
  function playCollisionSound() { playTone(100, 0.5); }


  // Player state
  const player = {
    x: 50,
    y: canvas.height - 40,
    width: 30,
    height: 40,
    vy: 0,
    jumping: false,
    sliding: false,
    slideTimer: 0,
    color: '#0a84ff',
  };

  // Obstacles, clouds and ground segments
  const obstacles = [];
  const clouds = [];
  const groundSegments = [];
  let lastObstacle = 0;
  let lastCloud = 0;
  let lastGround = 0;
  let distance = 0;
  let gameOver = false;

  function resetPlayer() {
    player.y = canvas.height - player.height;
    player.vy = 0;
    player.jumping = false;
    player.sliding = false;
    player.slideTimer = 0;
    player.height = 40;
  }

  function spawnObstacle() {
    // Randomly choose type: high (requires slide) or low (requires jump)
    const type = Math.random() < 0.5 ? 'low' : 'high';
    const obs = {
      x: canvas.width,
      width: 20,
      height: type === 'low' ? 30 : 45,
      y: type === 'low' ? canvas.height - 30 : canvas.height - 45,
      type,
      // simple red gradient for obstacle
      colorTop: '#ff7f7f',
      colorBottom: '#c70039',
    };
    obstacles.push(obs);
  }

  // Cloud creation
  function spawnCloud() {
    const r = 20 + Math.random() * 15; // radius 20-35
    const cloud = {
      x: canvas.width + Math.random() * 50,
      y: 20 + Math.random() * (canvas.height / 2 - 40),
      r,
    };
    clouds.push(cloud);
  }

  // Utility to generate a random green shade for ground
  function randomGreen() {
    const hue = 90 + Math.random() * 30; // 90-120 degrees
    const sat = 40 + Math.random() * 30; // 40-70%
    const lum = 30 + Math.random() * 20; // 30-50%
    return `hsl(${hue},${sat}%,${lum}%)`;
  }

  // Ground segment creation for parallax scrolling
  function spawnGround() {
    const width = 40 + Math.random() * 80; // 40-120px
    const g = {
      x: canvas.width,
      y: canvas.height - 20, // align with ground line height
      width,
      height: 20,
      color: randomGreen(), // varying green shade
    };
    groundSegments.push(g);
  }

  function update(delta) {
    if (gameOver) return;

    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // ground collision
    if (player.y + player.height >= canvas.height) {
      player.y = canvas.height - player.height;
      player.vy = 0;
      player.jumping = false;
    }

    // Slide timer
    if (player.sliding) {
      player.slideTimer -= delta;
      if (player.slideTimer <= 0) {
        player.sliding = false;
        player.height = 40;
        player.y = canvas.height - player.height;
      }
    }

    // Obstacles movement
    obstacles.forEach(o => o.x -= OBSTACLE_SPEED);
    // Clouds movement (parallax)
    clouds.forEach(c => c.x -= CLOUD_SPEED);
    // Ground segments movement (parallax)
    groundSegments.forEach(g => g.x -= GROUND_SPEED);
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].width < 0) {
      obstacles.shift();
    }
    // Remove off‑screen clouds
    while (clouds.length && clouds[0].x + clouds[0].r * 2 < 0) {
      clouds.shift();
    }
    // Remove off‑screen ground segments
    while (groundSegments.length && groundSegments[0].x + groundSegments[0].width < 0) {
      groundSegments.shift();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        gameOver = true;
        playCollisionSound();
        break;
      }
    }

    // Spawn obstacles and clouds
    const now = performance.now();
    if (now - lastObstacle > OBSTACLE_INTERVAL) {
      spawnObstacle();
      lastObstacle = now;
    }
    if (now - lastCloud > CLOUD_INTERVAL) {
      spawnCloud();
      lastCloud = now;
    }
    if (now - lastGround > GROUND_INTERVAL) {
      spawnGround();
      lastGround = now;
    }

    distance += OBSTACLE_SPEED * (delta / 1000);
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background with gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#e0f7fa'); // pale cyan
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw moving ground segments for parallax effect
    groundSegments.forEach(g => {
      ctx.fillStyle = g.color;
      ctx.fillRect(g.x, g.y, g.width, g.height);
    });
    // Simple clouds
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player – draw with rounded corners and a shadow
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 6);
    ctx.fill();
    ctx.restore();

    // Obstacles – draw with gradient and rounded corners
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.height);
      grad.addColorStop(0, o.colorTop);
      grad.addColorStop(1, o.colorBottom);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.width, o.height, 4);
      ctx.fill();
    });

    // UI – distance
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Distance: ${Math.floor(distance)} m`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
    }
  }

  // Input handling
  function handleKey(e) {
    if (gameOver) return;
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (!player.jumping && !player.sliding) {
        player.jumping = true;
        player.vy = JUMP_VELOCITY;
        playJumpSound();
      }
    } else if (e.code === 'ArrowDown') {
      if (!player.sliding && !player.jumping) {
        player.sliding = true;
        player.slideTimer = SLIDE_DURATION;
        // Reduce height for slide
        player.height = 20;
        player.y = canvas.height - player.height;
        playSlideSound();
      }
    }
  }
  window.addEventListener('keydown', handleKey);

  // Main loop
  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
