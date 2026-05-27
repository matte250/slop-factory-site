// game.js – simple endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // canvas size (adjust if needed)
  canvas.width = 800;
  canvas.height = 400;

  const GRAVITY = 0.5;
  const GROUND_Y = canvas.height - 50;

  const player = {
    x: 50,
    y: GROUND_Y - 30,
    w: 30,
    h: 30,
    vy: 0,
    jumping: false,
    sliding: false,
    slideTimer: 0,
  };

  const obstacles = [];
  const coins = [];
  let lastObstacleTime = 0;
  let lastCoinTime = 0;
  let gameOver = false;
  let score = 0;

  const spawnObstacle = () => {
    const type = Math.random() < 0.6 ? 'spike' : 'gap';
    if (type === 'spike') {
      obstacles.push({ x: canvas.width, y: GROUND_Y - 30, w: 30, h: 30, type: 'spike' });
    } else {
      // gap is represented by a ‘hole’ in the floor; we draw a tall rectangle that the player must jump over
      obstacles.push({ x: canvas.width, y: GROUND_Y, w: 80, h: 30, type: 'gap' });
    }
  };

  const spawnCoin = () => {
    coins.push({ x: canvas.width, y: GROUND_Y - 80, r: 8, collected: false });
  };

  const rectIntersect = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const circleRectIntersect = (c, r) => {
    // simple AABB check using circle bounds
    const nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
    const nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
    const dx = c.x - nearestX;
    const dy = c.y - nearestY;
    return dx * dx + dy * dy < c.r * c.r;
  };

  const update = (dt) => {
    if (gameOver) return;
    // player physics
    if (player.jumping) {
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= GROUND_Y - player.h) {
        player.y = GROUND_Y - player.h;
        player.vy = 0;
        player.jumping = false;
      }
    } else if (player.sliding) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) {
        player.sliding = false;
        player.h = 30;
        player.y = GROUND_Y - player.h;
      }
    }

    // spawn obstacles
    lastObstacleTime += dt;
    if (lastObstacleTime > 1500) { // ms
      spawnObstacle();
      lastObstacleTime = 0;
    }
    // spawn coins
    lastCoinTime += dt;
    if (lastCoinTime > 1000) {
      spawnCoin();
      lastCoinTime = 0;
    }

    // move obstacles and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // speed
        if (o.type === 'spike' && rectIntersect(player, o)) {
          gameOver = true;
          playGameOver();
        }
      if (o.type === 'gap') {
        // gap is a missing floor; player falls if over it and not jumping
          if (!player.jumping && player.x + player.w > o.x && player.x < o.x + o.w) {
            // simulate falling into gap
            gameOver = true;
            playGameOver();
          }
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // move coins and collect
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.x -= 4;
      if (!c.collected && circleRectIntersect({ x: player.x + player.w / 2, y: player.y + player.h / 2, r: 4 }, { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 })) {
        c.collected = true;
        score += 10;
      }
      if (c.x + c.r < 0) coins.splice(i, 1);
    }
    score += 0.01; // distance based score
  };

  // generate stars once
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * GROUND_Y,
    radius: Math.random() * 1.5 + 0.5,
  }));

  const draw = () => {
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#b0e0e6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);

    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground with subtle gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, canvas.height);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#3b2313');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // player as rounded rectangle
    ctx.fillStyle = '#ff5722';
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
    ctx.fill();

    // obstacles
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        // draw triangle spike
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else if (o.type === 'gap') {
        // represent gap by absent ground; nothing drawn
      }
    });

    // coins with gradient shine
    coins.forEach(c => {
      if (!c.collected) {
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        grad.addColorStop(0, '#fff9c4');
        grad.addColorStop(1, '#ffb300');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // score & game over overlay
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let lastTime = 0;
  const loop = (timestamp) => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playTone(440);
  const playSlide = () => playTone(220);
  const playCoin = () => playTone(660);
  const playGameOver = () => playTone(110);

  // input handling
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (!player.jumping) {
        player.jumping = true;
        player.vy = -12;
        playJump();
      }
    } else if (e.code === 'ArrowDown') {
      if (!player.sliding) {
        player.sliding = true;
        player.slideTimer = 500; // ms
        player.h = 15;
        player.y = GROUND_Y - player.h;
        playSlide();
      }
    }
  });
})();
