// Simple Pixel Dodger game targeting <canvas id="game">
// Controls: Space = jump, ArrowDown = slide

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.05);
    }, duration);
  }
  function playJumpSound() { playTone(400, 100); }
  function playSlideSound() { playTone(200, 80); }
  function playGameOverSound() { playTone(100, 300); }

  const player = { x: 50, y: height - 20, w: 20, h: 20, vy: 0, onGround: true, sliding: false };
  const GRAVITY = 0.8;
  const JUMP_SPEED = -12;
  const SLIDE_TIME = 15; // frames
  let slideCounter = 0;

  const obstacles = [];
  let frame = 0;
  let distance = 0;
  let gameOver = false;

  function spawnObstacle() {
    // Randomly choose type: 0 = spike (tall), 1 = block (wide), 2 = gap (missing floor)
    const type = Math.floor(Math.random() * 3);
    if (type === 2) {
      // Gap is handled by leaving a hole in the floor; we create a moving floor segment with a hole.
      // For simplicity we treat gap as a tall obstacle that player must jump over.
    }
    const obs = { x: width, w: 20 + Math.random() * 30, h: 20 + Math.random() * 30, type };
    obs.y = height - obs.h;
    obstacles.push(obs);
  }

  function update() {
    if (gameOver) return;
    frame++;
    distance = Math.floor(frame / 2);
    // player physics
    if (!player.onGround) {
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= height - player.h) {
        player.y = height - player.h;
        player.vy = 0;
        player.onGround = true;
        player.sliding = false;
        slideCounter = 0;
      }
    }
    if (player.sliding) {
      slideCounter++;
      if (slideCounter > SLIDE_TIME) {
        player.sliding = false;
        player.h = 20; // reset height
        slideCounter = 0;
      }
    }
    // obstacle movement & spawn
    if (frame % 90 === 0) spawnObstacle();
    obstacles.forEach(o => o.x -= 4);
    // remove off-screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        playGameOverSound();
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#001');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // floor with slight shading
    ctx.fillStyle = '#444';
    ctx.fillRect(0, height - 5, width, 5);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, height - 4, width, 1);

    // player – rounded square with gradient
    const pGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    pGrad.addColorStop(0, '#0f0');
    pGrad.addColorStop(1, '#090');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 4);
    ctx.fill();

    // obstacles – draw by type
    obstacles.forEach(o => {
      if (o.type === 0) { // spike – triangle
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else if (o.type === 1) { // block – dark red
        ctx.fillStyle = '#b00';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      } else { // gap placeholder – skip drawing (treated as spike)
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Distance: ${distance}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Distance: ${distance}`, width / 2, height / 2 + 20);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // input handling
  window.addEventListener('keydown', async e => {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state !== 'running') await audioCtx.resume();
    if (e.code === 'Space' && player.onGround && !player.sliding) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      playJumpSound();
    }
    if (e.code === 'ArrowDown' && player.onGround && !player.sliding) {
      player.sliding = true;
      player.h = 10; // lower hitbox
      player.y = height - player.h;
      playSlideSound();
    }
  });

  loop();
})();
