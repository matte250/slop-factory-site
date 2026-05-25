// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML page.

(() => {
  // Helper: draw rounded rectangle with optional fill and stroke
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (let side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a simple tone
  function playTone(freq, duration = 0.1, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.08); }
  function playSlideSound() { playTone(220, 0.1, 'square'); }
  function playCrashSound() { playTone(100, 0.3, 'triangle'); }
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.width || 800;
  const HEIGHT = canvas.height = canvas.height || 400;

  // Player configuration
  const PLAYER = {
    x: 80,
    y: HEIGHT - 60, // ground level (bottom of runner)
    w: 40,
    h: 60,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.6,
    isSliding: false,
    slideTimer: 0,
    color: '#0ff',
  };

  const GROUND_Y = HEIGHT - 20; // ground line

  // Obstacles
  const obstacles = [];
  const OBSTACLE_FREQ = 1500; // ms between spawns
  const OBSTACLE_SPEED = 4;
  const OBSTACLE_TYPES = [
    // tall obstacle (requires slide)
    { w: 30, h: 80, color: '#f44' },
    // low obstacle (requires jump)
    { w: 30, h: 30, color: '#f44' },
  ];

  let lastObstacleTime = 0;
  let score = 0;
  let gameOver = false;
  let lastTime = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction (required by browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
    if (e.key === 'ArrowUp' || e.key === ' ') attemptJump();
    if (e.key === 'ArrowDown') startSlide();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowDown') endSlide();
  });

  function attemptJump() {
    // can only jump when on ground and not sliding
    if (PLAYER.y >= GROUND_Y - PLAYER.h && !PLAYER.isSliding) {
      PLAYER.vy = PLAYER.jumpStrength;
      playJumpSound();
    }
  }

  function startSlide() {
    if (!PLAYER.isSliding && PLAYER.y >= GROUND_Y - PLAYER.h) {
      PLAYER.isSliding = true;
      PLAYER.slideTimer = 30; // frames
      PLAYER.h = 30; // reduce height
      playSlideSound();
    }
  }

  function endSlide() {
    if (PLAYER.isSliding) {
      PLAYER.isSliding = false;
      PLAYER.h = 60; // restore height
    }
  }

  function spawnObstacle() {
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    const obs = {
      x: WIDTH,
      y: GROUND_Y - type.h,
      w: type.w,
      h: type.h,
      color: type.color,
    };
    obstacles.push(obs);
  }

  function update(delta) {
    if (gameOver) return;
    // Player physics
    PLAYER.vy += PLAYER.gravity;
    PLAYER.y += PLAYER.vy;
    if (PLAYER.y > GROUND_Y - PLAYER.h) {
      PLAYER.y = GROUND_Y - PLAYER.h;
      PLAYER.vy = 0;
    }
    if (PLAYER.isSliding) {
      PLAYER.slideTimer--;
      if (PLAYER.slideTimer <= 0) endSlide();
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // collision detection
      if (rectIntersect(PLAYER, o)) {
        gameOver = true;
      }
      // remove off‑screen obstacles and increment score
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // spawn new obstacles
    if (performance.now() - lastObstacleTime > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacleTime = performance.now();
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }

  function draw() {
    // clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // background gradient (sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#001');
    skyGrad.addColorStop(1, '#004');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ground gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, HEIGHT);
    groundGrad.addColorStop(0, '#0a0');
    groundGrad.addColorStop(1, '#070');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
    // set neon glow style
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    // player (rounded rect)
    ctx.fillStyle = PLAYER.color;
    roundRect(ctx, PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h, 8, true, false);
    // obstacles (rounded rect, red glow)
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 12;
    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      roundRect(ctx, o.x, o.y, o.w, o.h, 5, true, false);
    });
    // reset shadow for UI text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`,
                 10, 30);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
