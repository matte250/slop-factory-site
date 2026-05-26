// Pixel Runner – simple endless runner
// Canvas must exist with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // basic dimensions and scaling for crisp visuals
  canvas.width = 800;
  canvas.height = 200;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playSound(440, 0.08); }
  function playHitSound() { playSound(150, 0.3); }

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20; // 2‑pixel‑wide sprite scaled for visibility
  const GROUND_Y = canvas.height - PLAYER_SIZE;

  const player = {
    x: 50,
    y: GROUND_Y,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
  };

  const obstacles = [];
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 90; // frames
  let score = 0;
  let running = true;

  function spawnObstacle() {
    const size = PLAYER_SIZE * (Math.random() > 0.5 ? 1 : 2);
    obstacles.push({
      x: canvas.width,
      y: GROUND_Y + PLAYER_SIZE - size, // sit on ground (or gap note)
      width: size,
      height: size,
    });
  }

  function update() {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles move left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 6; // speed
      // remove off‑screen
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // spawn logic
    spawnTimer++;
    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnTimer = 0;
      spawnObstacle();
    }

    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        running = false;
        playHitSound();
        break;
      }
    }
  }

function draw() {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0a0a2a');
    skyGrad.addColorStop(1, '#020212');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // simple moving hills (parallax)
    ctx.fillStyle = '#162030';
    const hillY = GROUND_Y - 30;
    for (let i = -1; i < 3; i++) {
      const offset = (spawnTimer * 0.5) % canvas.width;
      const x = i * 300 - offset;
      ctx.beginPath();
      ctx.moveTo(x, hillY + 20);
      ctx.quadraticCurveTo(x + 75, hillY - 40, x + 150, hillY + 20);
      ctx.lineTo(x + 150, canvas.height);
      ctx.lineTo(x, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    // ground line already drawn in player section
    // player (cyan with subtle bobbing)
    ctx.fillStyle = '#0ff';
    const bob = Math.sin(Date.now() / 200) * 2;
    ctx.fillRect(player.x, player.y + bob, player.width, player.height);

    // obstacles (spike triangles)
    ctx.fillStyle = '#f44';
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.height);
      ctx.lineTo(o.x + o.width / 2, o.y);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.closePath();
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over – Score: ' + score, canvas.width / 2 - 120, canvas.height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // input handling
  function jump() {
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    }
  }
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
  });
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });

  // start
  loop();
})();
