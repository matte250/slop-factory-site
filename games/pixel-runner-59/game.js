// Simple endless runner for canvas with id="game"
// Player jumps with Space or mouse click.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const width = canvas.width = 400;
  const height = canvas.height = 200;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -10;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // distance between obstacles

  let player = { x: 50, y: height - PLAYER_SIZE, vy: 0, w: PLAYER_SIZE, h: PLAYER_SIZE };
  let obstacles = [];
  // simple clouds for background
  let clouds = [];
  let frames = 0;
  let speed = 2;
  let score = 0;
  let gameOver = false;

  const reset = () => {
    player.y = height - PLAYER_SIZE;
    player.vy = 0;
    obstacles = [];
    clouds = [];
    frames = 0;
    speed = 2;
    score = 0;
    gameOver = false;
    // initial clouds
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * width,
        y: 20 + Math.random() * 40,
        rX: 30 + Math.random() * 20,
        rY: 10 + Math.random() * 10,
        speed: 0.3 + Math.random() * 0.2
      });
    }
    requestAnimationFrame(loop);
  };

  const jump = () => {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.y >= height - PLAYER_SIZE) {
      player.vy = JUMP_VELOCITY;
    }
  };

  // Input
  window.addEventListener('keydown', e => { if (e.code === 'Space') { jump(); playBeep(440,0.1); } });
  canvas.addEventListener('click', jump);

  const spawnObstacle = () => {
    const obsHeight = 30 + Math.random() * 40;
    const grad = ctx.createLinearGradient(0, height - obsHeight, 0, height);
    grad.addColorStop(0, '#b22222'); // firebrick
    grad.addColorStop(1, '#8b0000'); // dark red
    obstacles.push({ x: width, y: height - obsHeight, w: OBSTACLE_WIDTH, h: obsHeight, color: grad });
  };

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > height - PLAYER_SIZE) {
      player.y = height - PLAYER_SIZE;
      player.vy = 0;
    }

    // obstacles movement & spawn
    obstacles.forEach(o => o.x -= speed);
    // clouds movement (parallax)
    clouds.forEach(c => c.x -= c.speed);
    clouds = clouds.filter(c => c.x + c.rX > 0);
    if (frames % Math.round(OBSTACLE_GAP / speed) === 0) spawnObstacle();
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // recycle clouds
    if (clouds.length < 5) {
      clouds.push({
        x: width + Math.random() * 50,
        y: 20 + Math.random() * 40,
        rX: 30 + Math.random() * 20,
        rY: 10 + Math.random() * 10,
        speed: 0.3 + Math.random() * 0.2
      });
    }
    // play collision sound if game over just set
    if (gameOver && audioCtx.state !== 'suspended') {
      playBeep(220, 0.3);
    }

    // collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        break;
      }
    }

    // score & speed
    if (!gameOver) {
      score++;
      if (score % 500 === 0) speed += 0.5;
    }
  };

  const draw = () => {
    // background already cleared earlier
    // draw clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rX, c.rY, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // ground gradient
    const groundGrad = ctx.createLinearGradient(0, height - 10, 0, height);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#332211');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height - 10, width, 10);
    // player (gradient circle)
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 8,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    playerGrad.addColorStop(0, '#ffff99');
    playerGrad.addColorStop(1, '#ff6600');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();
    // obstacles
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 30), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2 - 70, height / 2);
    }
  };

  const loop = () => {
    if (gameOver) return;
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
  };

  // start game
  reset();
})();
