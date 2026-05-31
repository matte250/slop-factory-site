// Simple side‑scrolling runner targeting canvas#game
// Improved graphics: background gradient, neon glow, varied obstacle colors
// Inspired by IDEA.md

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 400);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // Game parameters
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SCROLL_SPEED = 4;
  const PLAYER_SIZE = 30;
  const PLAYER_X = 80;

  // Player state
  const player = {
    x: PLAYER_X,
    y: H - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    sliding: false,
    onGround: true,
  };

  // Obstacles – simple rectangles
  const obstacles = [];
  let frame = 0;
  let gameOver = false;

  // Input handling
  // Ensure audio context is running on first user interaction
  const ensureAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };

  const onKey = (e) => {
    if (gameOver) return;
    ensureAudio();
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (player.onGround) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
        player.sliding = false;
        // Jump sound
        playTone(440, 0.1);
      }
    } else if (e.code === 'ArrowDown') {
      if (player.onGround) {
        player.sliding = true;
        // Slide sound
        playTone(220, 0.1);
      }
    }
  };
  const onKeyUp = (e) => {
    if (e.code === 'ArrowDown') player.sliding = false;
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);

  const spawnObstacle = () => {
    const type = Math.random();
    if (type < 0.5) {
      // spike – triangle (treated as rect for simplicity)
      const size = 20 + Math.random() * 20;
      obstacles.push({ x: W, y: H - size, w: size, h: size, type: 'spike' });
    } else if (type < 0.8) {
      // gap – represented by a missing floor segment (handled in collision)
      const gapWidth = 50 + Math.random() * 30;
      obstacles.push({ x: W, y: H, w: gapWidth, h: 0, type: 'gap' });
    } else {
      // wall – tall rectangle
      const width = 20 + Math.random() * 30;
      const height = 60 + Math.random() * 40;
      obstacles.push({ x: W, y: H - height, w: width, h: height, type: 'wall' });
    }
  };

  const rectCollide = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const update = () => {
    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // Adjust height when sliding
    player.h = player.sliding ? PLAYER_SIZE / 2 : PLAYER_SIZE;
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Spawn
    if (frame % 90 === 0) spawnObstacle();
    // Collision detection
    for (const o of obstacles) {
      if (o.type === 'gap') {
        // gap means floor missing, player falls if over it and not jumping
        if (player.x + player.w > o.x && player.x < o.x + o.w && player.onGround) {
          // Gap collision sound
          playTone(150, 0.2);
          gameOver = true;
        }
      } else {
        if (rectCollide(player, o)) {
          // Hit obstacle sound
          playTone(80, 0.3);
          gameOver = true;
        }
      }
    }
    frame++;
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, '#0a001f'); // deep purple
    bgGrad.addColorStop(1, '#000000'); // black
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Floor with slight glow
    ctx.fillStyle = '#111';
    ctx.fillRect(0, H - 5, W, 5);

    // Neon glow settings (applies to subsequent draws)
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;

    // player (neon square)
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // obstacles with varied colors
    for (const o of obstacles) {
      if (o.type === 'gap') continue;
      switch (o.type) {
        case 'spike':
          ctx.fillStyle = '#f00'; // bright red
          break;
        case 'wall':
          ctx.fillStyle = '#ff8c00'; // orange
          break;
        default:
          ctx.fillStyle = '#fff';
      }
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // Reset shadow for UI overlay
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
