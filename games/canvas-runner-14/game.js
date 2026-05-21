// Minimal Canvas Runner implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill parent
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game state
  const player = { x: 50, y: 0, w: 30, h: 30, vy: 0, onGround: false };
  const gravity = 0.6;
  const jumpVel = -12;
  const obstacles = [];
  let speed = 4; // scroll speed
  let spawnTimer = 0;
  let score = 0;
  let gameOver = false;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  const input = () => {
    const jump = () => {
      if (player.onGround) {
        player.vy = jumpVel;
        player.onGround = false;
        // jump sound
        playTone(300, 0.1);
      }
    };
    window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
    canvas.addEventListener('pointerdown', jump);
  };
  input();

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: canvas.width, y: canvas.height - size, w: size, h: size });
  };

  const update = () => {
    if (gameOver) return;
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    const groundY = canvas.height - player.h;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 100 - Math.min(80, speed * 10); // faster spawns as speed rises
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        // collision sound
        playTone(100, 0.3);
        break;
      }
    }

    // Increase difficulty
    speed += 0.001;
    score++;
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Gradient sky background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#1e3a8a'); // dark blue
    skyGrad.addColorStop(1, '#0ea5e9'); // light blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Ground
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    // Player (simple pixel‑art stick figure)
    ctx.fillStyle = '#fbbf24'; // amber body
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(player.x + 8, player.y + 8, 4, 4);
    ctx.fillRect(player.x + 18, player.y + 8, 4, 4);
    // Obstacles – randomize shape/color
    obstacles.forEach(o => {
      // draw as triangle spike
      ctx.fillStyle = '#dc2626'; // red
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // Score / Game Over text
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  loop();
})();
