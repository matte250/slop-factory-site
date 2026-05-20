// Simple endless runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 200;
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;

  const player = { x: 50, y: H - PLAYER_SIZE, vy: 0, w: PLAYER_SIZE, h: PLAYER_SIZE, onGround: true };
  const obstacles = [];
  let frame = 0;
  let score = 0;

  // Audio helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playBeep(440, 0.1); // jump sound
    }
  });

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: W, y: H - size, w: size, h: size, speed: 4 });
  }

  function update() {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacles
    obstacles.forEach(o => o.x -= o.speed);
    // Remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
      obstacles.shift();
      score++;
    }

    // Collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // Game over – stop animation with sound
        playBeep(200, 0.4); // low beep for collision
        setTimeout(() => {
          alert('Game Over! Score: ' + score);
          document.location.reload();
        }, 400);
        return; // exit update loop
      }
    }

    // Spawn new obstacles
    if (frame % 120 === 0) spawnObstacle();
    frame++;
  }

  function draw() {
    // Background gradient (sky)
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#87CEFA'); // light sky blue
    sky.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Ground strip
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - groundHeight, W, groundHeight);

    // Player (rounded rectangle)
    ctx.fillStyle = '#FF9500';
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

    // Obstacles (varying colors)
    obstacles.forEach(o => {
      const hue = Math.floor((o.x / W) * 360) % 360; // color variation based on position
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
