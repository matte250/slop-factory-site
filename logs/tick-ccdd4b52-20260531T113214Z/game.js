// Simple endless runner for canvas with id "game"
(() => {
  // graphics settings
  const GROUND_HEIGHT = 20;
  const SKY_GRADIENT = (() => {
    const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_HEIGHT);
    grad.addColorStop(0, '#87CEEB'); // sky blue
    grad.addColorStop(1, '#4682B4'); // steel blue
    return grad;
  })();
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const W = canvas.width = 800;
  const H = canvas.height = 200;
  const GRAVITY = 0.6;
  // Cloud data for background
  const clouds = [];
  const MAX_CLOUDS = 5;
  const createCloud = () => ({
    x: Math.random() * W,
    y: Math.random() * (H / 2),
    r: Math.random() * 12 + 8,
    speed: 0.5 + Math.random() * 0.5,
  });
  // initialize clouds
  for (let i = 0; i < MAX_CLOUDS; i++) clouds.push(createCloud());
  const JUMP_SPEED = -12;

  const player = { x: 50, y: H - 40, w: 30, h: 30, vy: 0, onGround: true };
  const obstacles = [];
  let speed = 4;
  let frame = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const gap = Math.random() * 120 + 80; // distance between obstacles
    const size = Math.random() * 30 + 20; // obstacle height
    const lastX = obstacles.length ? obstacles[obstacles.length - 1].x : W;
    obstacles.push({ x: lastX + gap, w: 20, h: size });
  };

  const reset = () => {
    obstacles.length = 0;
    player.y = H - player.h;
    player.vy = 0;
    player.onGround = true;
    speed = 4;
    frame = 0;
    gameOver = false;
    spawnObstacle();
    loop();
  };

  const loop = () => {
    if (gameOver) return;
    // clear canvas
    ctx.clearRect(0, 0, W, H);
    // draw sky
    ctx.fillStyle = SKY_GRADIENT;
    ctx.fillRect(0, 0, W, H - GROUND_HEIGHT);
    // draw ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);
    // update and draw clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.r < 0) {
        c.x = W + c.r;
        c.y = Math.random() * (H / 2);
      }
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= H - player.h) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // draw player (with simple shadow)
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(player.x + 3, player.y + player.h + 2, player.w, 4);
    // player body
    ctx.fillStyle = '#0a0';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // obstacles
    ctx.fillStyle = '#a00';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      ctx.fillRect(o.x, H - o.h, o.w, o.h);

      // collision
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y + player.h > H - o.h
      ) {
        playTone(150, 0.3); // collision sound
gameOver = true;
      }

      // remove passed obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // spawn new obstacles
    if (frame % 100 === 0) spawnObstacle();
    frame++;
    speed += 0.001; // gradual speed increase

    if (gameOver) {
      ctx.fillStyle = '#000';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    } else {
      requestAnimationFrame(loop);
    }
  };

  // input handling
  canvas.addEventListener('pointerdown', () => {
    // ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (player.onGround && !gameOver) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      playTone(440, 0.1);
    } else if (gameOver) {
      reset();
    }
  });

  // start
  reset();
})();
