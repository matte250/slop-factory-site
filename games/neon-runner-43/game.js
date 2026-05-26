// Neon Runner – simple infinite side‑scroller
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPEED = 4; // world scroll speed (pixels per frame)
  const PLAYER_SIZE = 30;
  const OBSTACLE_SPACING = 300; // distance between obstacles
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_HEIGHT = 60;
  const ORB_RADIUS = 8;

  // State
  let player = { x: 80, y: height - PLAYER_SIZE, vy: 0, onGround: true };
  let obstacles = [];
  let orbs = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // Input – click/tap makes the player jump if on ground
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  canvas.addEventListener('pointerdown', () => {
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playTone(300, 'sawtooth', 0.08); // jump sound
    }
  });

  // Helper – spawn an obstacle when needed
  function spawnObstacle() {
    const x = width + Math.random() * 200; // start off‑screen right
    obstacles.push({ x, w: OBSTACLE_WIDTH, h: OBSTACLE_HEIGHT });
  }

  // Helper – spawn an orb
  function spawnOrb() {
    const x = width + Math.random() * 200;
    const y = height - PLAYER_SIZE - 80 - Math.random() * 60;
    orbs.push({ x, y });
  }

  // Collision detection
  function rectCollides(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function circleRectCollides(cx, cy, cr, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < cr * cr;
  }

  function update() {
    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= height - PLAYER_SIZE) {
      player.y = height - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles and orbs leftward
    obstacles.forEach(o => o.x -= SPEED);
    orbs.forEach(o => o.x -= SPEED);

    // Remove off‑screen items
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    orbs = orbs.filter(o => o.x + ORB_RADIUS > 0);

    // Spawn new obstacles/orbs
    if (frame % Math.floor(OBSTACLE_SPACING / SPEED) === 0) spawnObstacle();
    if (frame % 120 === 0) spawnOrb();

    // Collision checks
    for (const o of obstacles) {
        if (rectCollides(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, o.x, height - o.h, o.w, o.h)) {
          gameOver = true;
          playTone(100, 'sawtooth', 0.3); // game over sound
          break;
        }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
        if (circleRectCollides(orb.x, orb.y, ORB_RADIUS, player.x, player.y, PLAYER_SIZE, PLAYER_SIZE)) {
          score++;
          playTone(600, 'sine', 0.07); // score sound
          orbs.splice(i, 1);
        }
    }

    frame++;
  }

  function render() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Ground line with glow
    ctx.fillStyle = '#0aa';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(0, height - 5, width, 5);
    ctx.shadowBlur = 0;
    // Player (neon circle)
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2, PLAYER_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Obstacles with rounded neon
    ctx.fillStyle = '#f0f';
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 12;
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x + 5, height - o.h);
      ctx.lineTo(o.x + o.w - 5, height - o.h);
      ctx.quadraticCurveTo(o.x + o.w, height - o.h, o.x + o.w, height - o.h + 5);
      ctx.lineTo(o.x + o.w, height);
      ctx.lineTo(o.x, height);
      ctx.lineTo(o.x, height - o.h + 5);
      ctx.quadraticCurveTo(o.x, height - o.h, o.x + 5, height - o.h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // Orbs with glow
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 10;
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, ORB_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
