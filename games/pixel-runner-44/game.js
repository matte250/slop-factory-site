// Minimal endless runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 400);
  // background offset for scrolling effect
  let bgOffset = 0;
  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
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

  // Player
  const player = { x: 50, y: height - 40, w: 30, h: 30, vy: 0 };
  const GRAVITY = 0.8;
  const JUMP = -15;
  let onGround = true;

  // Obstacles
  let obstacles = [];
  const OBSTACLE_W = 30;
  const GAP_MIN = 150;
  const GAP_MAX = 300;
  let nextObstacleX = width + 100;

  // Game state
  let speed = 4;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const type = Math.random() < 0.5 ? 'spike' : 'block';
    const h = type === 'spike' ? 30 : 60;
    obstacles.push({ x: nextObstacleX, w: OBSTACLE_W, h, type });
    nextObstacleX += OBSTACLE_W + GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
  };

  const reset = () => {
    player.y = height - player.h;
    player.vy = 0;
    obstacles = [];
    nextObstacleX = width + 100;
    speed = 4;
    score = 0;
    gameOver = false;
    spawnObstacle();
    requestAnimationFrame(loop);
  };

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > height - player.h) {
      player.y = height - player.h;
      player.vy = 0;
      onGround = true;
    } else {
      onGround = false;
    }

    // obstacles movement
    obstacles.forEach((o) => (o.x -= speed));
    // remove passed obstacles
    if (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
      obstacles.shift();
      score++;
      // gradually increase speed
      speed += 0.2;
    }
    // spawn new obstacles
    if (nextObstacleX - obstacles[obstacles.length - 1]?.x < GAP_MIN) spawnObstacle();
    // collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < height - o.h &&
        player.y + player.h > height - o.h
      ) {
        gameOver = true;
        playTone(200, 0.3); // collision sound
      }
    }
  };


  const draw = () => {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // moving ground pattern
    for (let i = -40; i < width; i += 40) {
      ctx.fillStyle = ((Math.floor((i + bgOffset) / 40) % 2) === 0) ? '#555' : '#444';
      ctx.fillRect(i, height - 10, 40, 10);
    }

    // player (rounded square)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x + 5, player.y);
    ctx.lineTo(player.x + player.w - 5, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + 5);
    ctx.lineTo(player.x + player.w, player.y + player.h - 5);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - 5, player.y + player.h);
    ctx.lineTo(player.x + 5, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - 5);
    ctx.lineTo(player.x, player.y + 5);
    ctx.quadraticCurveTo(player.x, player.y, player.x + 5, player.y);
    ctx.closePath();
    ctx.fill();

    // obstacles with type colors
    obstacles.forEach((o) => {
      ctx.fillStyle = o.type === 'spike' ? '#f90' : '#f00';
      ctx.fillRect(o.x, height - o.h, o.w, o.h);
    });

    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = () => {
    if (gameOver) return;
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // ensure audio can start after user gesture
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  document.addEventListener('click', resumeAudio);
  document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ') && onGround && !gameOver) {
      player.vy = JUMP;
      onGround = false;
      playTone(400, 0.1); // jump sound
    }
    if (e.code === 'Enter' && gameOver) reset();
  });

  // start
  reset();
})();
