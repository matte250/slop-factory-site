// Simple endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 200;
  const groundHeight = 20; // height of ground strip
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => playTone(300, 0.1);
  const playCrashSound = () => playTone(100, 0.3);

  // Player (small square, larger for visibility)
  const player = { x: 50, y: height - 30, w: 10, h: 10, vy: 0, onGround: true };
  const gravity = 0.4;
  const jumpStrength = -8;

  // Obstacles
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  // Input
  const jump = () => {
    if (player.onGround) { player.vy = jumpStrength; player.onGround = false; playJumpSound(); }
  };
  window.addEventListener('click', jump);
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });

  const update = () => {
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    // Ground collision
    const groundHeight = 20;
    if (player.y >= height - groundHeight - player.h) { player.y = height - groundHeight - player.h; player.vy = 0; player.onGround = true; }

    // Spawn obstacles
    if (obstacleTimer <= 0) {
      const size = Math.random() * 20 + 10; // random height
      obstacles.push({ x: width, y: height - size, w: 10, h: size });
      obstacleTimer = obstacleInterval;
    } else obstacleTimer--;

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= 3; // speed
      // Remove off‑screen
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // Game over – play crash sound and reset
        playCrashSound();
        obstacles.length = 0;
        player.y = height - player.h;
        player.vy = 0;
        player.onGround = true;
        break;
      }
    }
  };

  const draw = () => {
    // Sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height);
    // Ground
    const groundHeight = 20;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);
    // Player (white with black border)
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.w, player.h);
    // Obstacles (dark red)
    ctx.fillStyle = '#b71c1c';
    for (const o of obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
