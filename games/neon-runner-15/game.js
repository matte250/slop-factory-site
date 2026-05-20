// Minimal endless runner based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone generator
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const PLAYER_X = 80; // fixed horizontal position
  const SCROLL_SPEED = 4;
  const GAP_PROB = 0.2; // chance to start a gap
  const OBSTACLE_PROB = 0.2; // chance to spawn an obstacle

  // Player state
  const player = {
    y: HEIGHT - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    sliding: false,
    slideTimer: 0,
  };

  // World elements
  let floorSegments = []; // {x, width, gap}
  let obstacles = []; // {x, y, w, h}

  // Helpers
  function addFloorSegment() {
    const last = floorSegments[floorSegments.length - 1];
    const startX = last ? last.x + last.width : 0;
    const segWidth = Math.random() * 80 + 80; // 80-160px
    const isGap = Math.random() < GAP_PROB;
    floorSegments.push({ x: startX, width: segWidth, gap: isGap });
  }

  function spawnObstacle() {
    const height = Math.random() * 30 + 20;
    const width = Math.random() * 20 + 20;
    const y = HEIGHT - PLAYER_SIZE - height; // on the floor
    const x = WIDTH + width;
    obstacles.push({ x, y, w: width, h: height });
  }

  function update() {
    // Move floor & obstacles leftwards
    floorSegments.forEach(seg => seg.x -= SCROLL_SPEED);
    obstacles.forEach(obs => obs.x -= SCROLL_SPEED);

    // Remove off‑screen elements
    while (floorSegments.length && floorSegments[0].x + floorSegments[0].width < 0) floorSegments.shift();
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // Ensure enough floor ahead
    if (floorSegments.length === 0 || floorSegments[floorSegments.length - 1].x < WIDTH) addFloorSegment();
    // Random obstacle spawn
    if (Math.random() < OBSTACLE_PROB) spawnObstacle();

    // Player physics
    if (!player.sliding) {
      player.vy += GRAVITY;
    } else {
      player.vy = 0; // slide keeps player grounded
    }
    player.y += player.vy;

    // Ground detection (including gaps)
    const footX = PLAYER_X + player.width / 2;
    const segment = floorSegments.find(seg => footX >= seg.x && footX <= seg.x + seg.width && !seg.gap);
    const onGround = segment && player.y + player.height >= HEIGHT - PLAYER_SIZE;
    if (onGround) {
      player.y = HEIGHT - PLAYER_SIZE - player.height;
      player.vy = 0;
    }

    // Slide handling
    if (player.sliding) {
      player.slideTimer--;
      if (player.slideTimer <= 0) {
        player.sliding = false;
        player.height = PLAYER_SIZE;
        player.y -= PLAYER_SIZE / 2; // restore height
      }
    }

    // Collision with obstacles
    for (const obs of obstacles) {
      if (
        PLAYER_X < obs.x + obs.w &&
        PLAYER_X + player.width > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.height > obs.y
      ) {
        gameOver();
        return;
      }
    }

    // Falling into a gap ends game
    if (!segment && player.y + player.height >= HEIGHT) {
      gameOver();
      return;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw floor as neon line
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    floorSegments.forEach(seg => {
      if (!seg.gap) {
        ctx.fillRect(seg.x, HEIGHT - PLAYER_SIZE, seg.width, 4);
      }
    });
    ctx.shadowBlur = 0;

    // Draw obstacles as rounded neon blocks
    obstacles.forEach(obs => {
      ctx.fillStyle = '#f00';
      ctx.shadowColor = '#f00';
      ctx.shadowBlur = 6;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(obs.x + radius, obs.y);
      ctx.lineTo(obs.x + obs.w - radius, obs.y);
      ctx.quadraticCurveTo(obs.x + obs.w, obs.y, obs.x + obs.w, obs.y + radius);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h - radius);
      ctx.quadraticCurveTo(obs.x + obs.w, obs.y + obs.h, obs.x + obs.w - radius, obs.y + obs.h);
      ctx.lineTo(obs.x + radius, obs.y + obs.h);
      ctx.quadraticCurveTo(obs.x, obs.y + obs.h, obs.x, obs.y + obs.h - radius);
      ctx.lineTo(obs.x, obs.y + radius);
      ctx.quadraticCurveTo(obs.x, obs.y, obs.x + radius, obs.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw player (glowing neon square with slight rotation)
    ctx.save();
    ctx.translate(PLAYER_X + player.width / 2, player.y + player.height / 2);
    ctx.rotate(Math.sin(Date.now() / 200) * 0.02);
    ctx.translate(-player.width / 2, -player.height / 2);
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(0, 0, player.width, player.height);
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  let running = true;
  function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
  }

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.vy === 0) {
      player.vy = JUMP_VELOCITY;
      playTone(440); // jump sound
    }
    if (e.code === 'ArrowDown' && !player.sliding) {
      player.sliding = true;
      player.slideTimer = 20; // frames
      player.height = PLAYER_SIZE / 2;
      player.y += PLAYER_SIZE / 2; // lower hitbox
      playTone(220); // slide sound
    }
  });

  // Initialize first floor segment
  addFloorSegment();
  // Start loop
  requestAnimationFrame(loop);
})();
