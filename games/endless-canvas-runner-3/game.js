// Endless Canvas Runner
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort silently
  const ctx = canvas.getContext('2d');
  const WIDTH = (canvas.width = canvas.offsetWidth || 800);
  const HEIGHT = (canvas.height = canvas.offsetHeight || 200);

  const GRAVITY = 0.6;
  // Sound effects (embedded tiny wav files)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const GAP_MIN = 40;
  const GAP_MAX = 120;
  const SPIKE_HEIGHT = 20;

  let player = { x: 50, y: HEIGHT - PLAYER_SIZE, vy: 0, onGround: true };
  let obstacles = [];
  let gap = 0; // distance to next gap start
  let score = 0;
  let tick = 0;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnObstacle = () => {
    // decide whether to create a spike (triangle) or a solid block
    const type = Math.random() < 0.5 ? 'spike' : 'block';
    const x = WIDTH;
    const y = HEIGHT - (type === 'spike' ? SPIKE_HEIGHT : PLAYER_SIZE);
    obstacles.push({ type, x, y, w: OBSTACLE_WIDTH, h: type === 'spike' ? SPIKE_HEIGHT : PLAYER_SIZE });
    // set distance to next gap
    gap = Math.round(rand(GAP_MIN, GAP_MAX));
  };

  const handleInput = (e) => {
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      // play jump sound
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  };

  window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleInput(e); });
  canvas.addEventListener('pointerdown', handleInput);

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= HEIGHT - PLAYER_SIZE) {
      player.y = HEIGHT - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // scroll speed
      // collision detection (simple AABB for block, point for spike)
      if (o.type === 'block') {
        if (
          player.x < o.x + o.w &&
          player.x + PLAYER_SIZE > o.x &&
          player.y < o.y + o.h &&
          player.y + PLAYER_SIZE > o.y
        ) {
          gameOver();
          return;
        }
      } else {
        // spike is a triangle with its tip at (x+ w/2, y)
        const tipX = o.x + o.w / 2;
        const tipY = o.y;
        // simple point-in-rectangle check for player square touching tip region
        if (
          player.x < tipX + SPIKE_HEIGHT &&
          player.x + PLAYER_SIZE > tipX - SPIKE_HEIGHT &&
          player.y < tipY + SPIKE_HEIGHT &&
          player.y + PLAYER_SIZE > tipY
        ) {
          gameOver();
          return;
        }
      }
      // remove off‑screen obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // spawn new obstacles based on gap distance
    if (gap <= 0) {
      spawnObstacle();
    } else {
      gap--;
    }

    score++;
    tick++;
  };

  // Helper to draw a rounded rectangle
  const drawRoundedRect = (x, y, w, h, r, fillStyle) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  };

  const draw = () => {
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#b0e0e6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ground gradient
    const groundGrad = ctx.createLinearGradient(0, HEIGHT - 30, 0, HEIGHT);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HEIGHT - 30, WIDTH, 30);

    // player with rounded corners and gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + PLAYER_SIZE);
    playerGrad.addColorStop(0, '#00ff00');
    playerGrad.addColorStop(1, '#006400');
    drawRoundedRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, 4, playerGrad);

    // obstacles
    for (const o of obstacles) {
      if (o.type === 'block') {
        const blockGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        blockGrad.addColorStop(0, '#ff4444');
        blockGrad.addColorStop(1, '#880000');
        drawRoundedRect(o.x, o.y, o.w, o.h, 3, blockGrad);
      } else {
        const spikeGrad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y);
        spikeGrad.addColorStop(0, '#ff8888');
        spikeGrad.addColorStop(1, '#aa0000');
        ctx.fillStyle = spikeGrad;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
    }
    // score with shadow
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText('Score: ' + Math.floor(score / 10), 10, 20);
    ctx.shadowColor = 'transparent';
  };

  let animationId;
  const loop = () => {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  };

  const gameOver = () => {
    // play crash sound
    crashSound.currentTime = 0;
    crashSound.play();
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
    ctx.fillText('Score: ' + Math.floor(score / 10), WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText('Refresh to play again', WIDTH / 2, HEIGHT / 2 + 50);
  };

  // start
  loop();
})();
