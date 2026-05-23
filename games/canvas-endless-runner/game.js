// Endless runner for canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 200);

  const groundY = H - 40;
  // background elements
  const clouds = [];
  const cloudSpeed = 0.5;
  // generate initial clouds
  for (let i = 0; i < 5; i++) {
    clouds.push({ x: Math.random() * W, y: 20 + Math.random() * 30, r: 15 + Math.random() * 10 });
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playBeep(400, 0.08);
  const playGameOver = () => playBeep(150, 0.4);
  const player = { x: 50, y: groundY - 20, w: 20, h: 20, vy: 0, onGround: true };
  const gravity = 0.8;
  const jumpStrength = -15;
  const speed = 4;
  let obstacles = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const type = Math.random() < 0.6 ? 'spike' : 'gap';
    const width = 20 + Math.random() * 30;
    obstacles.push({ x: W, type, w: width, h: 20 });
  };

  const update = () => {
    if (gameOver) return;
    frame++;
    if (frame % 120 === 0) spawnObstacle(); // roughly every 2 seconds

    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

  // move obstacles
  obstacles.forEach(o => (o.x -= speed));
  // move clouds (parallax)
  clouds.forEach(c => (c.x -= cloudSpeed));
  // recycle clouds
  clouds.forEach(c => {
    if (c.x + c.r < 0) {
      c.x = W + Math.random() * 50;
      c.y = 20 + Math.random() * 30;
      c.r = 15 + Math.random() * 10;
    }
  });
  // remove off‑screen
  obstacles = obstacles.filter(o => o.x + o.w > 0);


    // collision detection
    for (const o of obstacles) {
      if (o.type === 'spike') {
        // simple AABB check
        if (
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < groundY &&
          player.y + player.h > groundY - o.h
        ) {
          if (!gameOver) {
            gameOver = true;
            playGameOver();
          }
        }
      } else if (o.type === 'gap') {
        // if player is over gap and not jumping
        if (
          player.x + player.w > o.x &&
          player.x < o.x + o.w &&
          player.y + player.h >= groundY
        ) {
          if (!gameOver) {
            gameOver = true;
            playGameOver();
          }
        }
      }
    }

    score = Math.floor(frame / 2);
    draw();
    if (!gameOver) requestAnimationFrame(update);
    else {
      ctx.fillStyle = 'black';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over! Score: ' + score, W / 2 - 80, H / 2);
    }
  };

  const draw = () => {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, groundY);

    // clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground gradient
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#3B2219');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    // draw gaps (simple clear)
    obstacles
      .filter(o => o.type === 'gap')
      .forEach(o => ctx.clearRect(o.x, groundY, o.w, H - groundY));

    // spikes with simple shading
    ctx.fillStyle = '#D32F2F';
    obstacles
      .filter(o => o.type === 'spike')
      .forEach(o => {
        ctx.beginPath();
        ctx.moveTo(o.x, groundY);
        ctx.lineTo(o.x + o.w / 2, groundY - o.h);
        ctx.lineTo(o.x + o.w, groundY);
        ctx.closePath();
        ctx.fill();
        // highlight
        ctx.strokeStyle = '#FF8A80';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

    // player as rounded rectangle
    ctx.fillStyle = '#4285F4';
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // score
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  // input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.onGround && !gameOver) {
      player.vy = jumpStrength;
      player.onGround = false;
      playJump();
    }
  });

  update();
})();
