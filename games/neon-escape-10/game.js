// Minimal Neon Escape game
// Canvas with id="game" must exist in the HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context runs after first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('keydown', resumeAudio); window.removeEventListener('touchstart', resumeAudio); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('touchstart', resumeAudio);

  const WIDTH = canvas.width = 400;
  const HEIGHT = canvas.height = 600;

  // Player
  const player = { x: 50, y: HEIGHT / 2, size: 20, speed: 3 };

  // Obstacles (vertical bars with a gap)
  const bars = [];
  const BAR_WIDTH = 30;
  const GAP_HEIGHT = 150;
  const BAR_SPEED = 2;
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 90; // frames
  let score = 0;

  let upPressed = false;
  let downPressed = false;
  let gameOver = false;

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') upPressed = true;
    if (e.key === 'ArrowDown') downPressed = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') upPressed = false;
    if (e.key === 'ArrowDown') downPressed = false;
  });

  function spawnBar() {
    const gapY = Math.random() * (HEIGHT - GAP_HEIGHT);
    bars.push({ x: WIDTH, gapY, passed: false });
  }

  function update() {
    if (gameOver) return;
    // Move player with sound
    if (upPressed) {
      player.y -= player.speed;
      playTone(300, 0.07);
    }
    if (downPressed) {
      player.y += player.speed;
      playTone(500, 0.07);
    }
    // Keep player inside canvas
    if (player.y < 0) player.y = 0;
    if (player.y + player.size > HEIGHT) player.y = HEIGHT - player.size;

    // Spawn bars
    if (spawnTimer <= 0) {
      spawnBar();
      spawnTimer = SPAWN_INTERVAL;
    } else {
      spawnTimer--;
    }

    // Move bars, scoring, and collisions
    for (let i = bars.length - 1; i >= 0; i--) {
      const bar = bars[i];
      bar.x -= BAR_SPEED;
      // Score when player passes bar
      if (!bar.passed && bar.x + BAR_WIDTH < player.x) {
        bar.passed = true;
        score++;
        playTone(800, 0.05);
      }
      // Collision with player
      if (bar.x < player.x + player.size && bar.x + BAR_WIDTH > player.x) {
        if (player.y < bar.gapY || player.y + player.size > bar.gapY + GAP_HEIGHT) {
          gameOver = true;
          playTone(120, 0.3);
        }
      }
      // Remove off-screen bars
      if (bar.x + BAR_WIDTH < 0) bars.splice(i, 1);
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Neon glow settings
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;

    // Draw player with rounded corners
    ctx.fillStyle = '#0ff';
    const r = 4; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.size - r, player.y);
    ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + r);
    ctx.lineTo(player.x + player.size, player.y + player.size - r);
    ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - r, player.y + player.size);
    ctx.lineTo(player.x + r, player.y + player.size);
    ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset for bars

    // Draw bars with gradient and slight rounding
    for (const bar of bars) {
      const barGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      barGrad.addColorStop(0, '#450');
      barGrad.addColorStop(1, '#800');
      ctx.fillStyle = barGrad;
      // Upper part
      ctx.fillRect(bar.x, 0, BAR_WIDTH, bar.gapY);
      // Lower part
      ctx.fillRect(bar.x, bar.gapY + GAP_HEIGHT, BAR_WIDTH, HEIGHT - bar.gapY - GAP_HEIGHT);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
