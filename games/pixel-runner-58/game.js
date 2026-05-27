// Simple endless runner for canvas with id="game"
// Player can jump (Space) or slide (ArrowDown) to avoid obstacles.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440); }
  function playCollisionSound() { playTone(150); }

  // Game settings
  const groundY = height - 50;
  const gravity = 0.6;
  const jumpVelocity = -12;
  const slideDuration = 30; // frames
  const obstacleSpeed = 6;
  const obstacleFreq = 120; // frames between obstacles

  // Player state
  const player = {
    w: 40,
    h: 60,
    x: 80,
    y: groundY - 60,
    vy: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
  };

  const obstacles = [];
  // simple clouds for background
  const clouds = [];
  // initialize clouds
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * width,
      y: Math.random() * groundY * 0.5,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  let frameCount = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function reset() {
    player.y = groundY - player.h;
    player.vy = 0;
    player.isJumping = false;
    player.isSliding = false;
    player.slideTimer = 0;
    obstacles.length = 0;
    frameCount = 0;
    score = 0;
    gameOver = false;
    loop();
  }

  function spawnObstacle() {
    const types = ['low', 'high']; // low: jump, high: slide
    const type = types[Math.random() < 0.5 ? 0 : 1];
    const obs = {
      x: width,
      type,
      w: 30,
      h: type === 'low' ? 40 : 80,
      y: type === 'low' ? groundY - 40 : groundY - 80,
    };
    obstacles.push(obs);
  }

  function update() {
    if (gameOver) return;
    // Player input
    if (keys['Space'] && !player.isJumping && !player.isSliding) {
      // ensure audio context is running
      if (audioCtx.state === 'suspended') audioCtx.resume();
      player.vy = jumpVelocity;
      player.isJumping = true;
      playJumpSound();
    }
    if (keys['ArrowDown'] && !player.isSliding && !player.isJumping) {
      player.isSliding = true;
      player.slideTimer = slideDuration;
      player.h = 30; // reduced hitbox height
      player.y = groundY - player.h;
    }

    // Apply gravity
    if (player.isJumping) {
      player.vy += gravity;
      player.y += player.vy;
      if (player.y >= groundY - player.h) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.isJumping = false;
      }
    }

    // Sliding timer
    if (player.isSliding) {
      player.slideTimer--;
      if (player.slideTimer <= 0) {
        player.isSliding = false;
        player.h = 60;
        player.y = groundY - player.h;
      }
    }

    // Obstacles movement
    obstacles.forEach(o => o.x -= obstacleSpeed);
    // Clouds movement
    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -60) c.x = width + Math.random() * 50;
    });
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
      obstacles.shift();
      score++;
    }

    // Spawn new obstacles
    if (frameCount % obstacleFreq === 0) {
      spawnObstacle();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        // play collision sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playCollisionSound();
        break;
      }
    }
    frameCount++;
  }

  function draw() {
    // clear canvas
    ctx.clearRect(0, 0, width, height);
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#87CEEB'); // light sky
    skyGrad.addColorStop(1, '#5DADE2'); // deeper
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);
    // clouds (simple ellipses)
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 30, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, groundY, width, height - groundY);
    // player (rounded green rectangle with eyes)
    ctx.fillStyle = '#28a745';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 8);
    ctx.fill();
    // eyes
    if (!player.isSliding) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(player.x + player.w * 0.3, player.y + player.h * 0.3, 4, 0, Math.PI * 2);
      ctx.arc(player.x + player.w * 0.7, player.y + player.h * 0.3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(player.x + player.w * 0.3, player.y + player.h * 0.3, 2, 0, Math.PI * 2);
      ctx.arc(player.x + player.w * 0.7, player.y + player.h * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // obstacles (rounded red rectangles)
    obstacles.forEach(o => {
      ctx.fillStyle = o.type === 'low' ? '#e74c3c' : '#c0392b';
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 6);
      ctx.fill();
    });
    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Press R to Restart', width / 2, height / 2 + 20);
    }
  }

  function loop() {
    if (gameOver) {
      // Wait for restart
      if (keys['KeyR']) reset();
    } else {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game
  reset();
})();
