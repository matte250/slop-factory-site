// Simple endless runner for canvas with id="game"
// Author: OpenAI

window.addEventListener('load', () => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(300, 0.1); }
  function playGameOverSound() { playTone(100, 0.3); }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // ground pattern (simple grass)
  const gpCanvas = document.createElement('canvas');
  gpCanvas.width = 20;
  gpCanvas.height = 20;
  const gpCtx = gpCanvas.getContext('2d');
  gpCtx.fillStyle = '#4caf50';
  gpCtx.fillRect(0, 0, 20, 20);
  gpCtx.fillStyle = '#2e7d32';
  gpCtx.beginPath();
  gpCtx.moveTo(0, 20);
  gpCtx.lineTo(10, 0);
  gpCtx.lineTo(20, 20);
  gpCtx.closePath();
  gpCtx.fill();
  const groundPattern = ctx.createPattern(gpCanvas, 'repeat');
  const W = canvas.width = 800;
  const H = canvas.height = 200;

  const GRAVITY = 0.6;
  const JUMP = -12;
  const GROUND = H - 30;

  const player = { x: 50, y: GROUND, w: 20, h: 30, vy: 0, onGround: true };
  let obstacles = [];
  let spawnTimer = 0;
  // clouds for background
  let clouds = [];
  let cloudTimer = 0;
  let score = 0;
  let running = true;

  function reset() {
    // clear obstacles and clouds
    obstacles = [];
    clouds = [];
    cloudTimer = 0;
    obstacles = [];
    player.y = GROUND;
    player.vy = 0;
    player.onGround = true;
    spawnTimer = 0;
    score = 0;
    running = true;
  }

  function spawnObstacle() {
    const size = Math.random() * 20 + 20; // 20‑40px spikes
    obstacles.push({ x: W, y: GROUND, w: size, h: size });
  }

  function update() {
    // Player physics
    if (!player.onGround) {
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= GROUND) {
        player.y = GROUND;
        player.vy = 0;
        player.onGround = true;
      }
    }
    // Obstacles movement & spawn
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = Math.round(60 + Math.random() * 60); // ~1‑2 sec
    }
    obstacles.forEach(o => o.x -= 6);
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // Cloud movement & spawn
    cloudTimer--;
    if (cloudTimer <= 0) {
      const radius = Math.random() * 15 + 15; // 15‑30px
      const y = Math.random() * (GROUND - 80) + 20; // keep above ground
      clouds.push({ x: W, y, r: radius });
      cloudTimer = Math.round(120 + Math.random() * 180); // ~2‑5 sec
    }
    clouds.forEach(c => c.x -= 2);
    clouds = clouds.filter(c => c.x + c.r > 0);
    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        running = false; // game over
        playGameOverSound();
        break;
      }
    }
    // Score
    score++;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light sky
    skyGrad.addColorStop(1, '#4682b4'); // deeper sky
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // simple clouds
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground texture using pattern
    ctx.fillStyle = groundPattern;
    ctx.fillRect(0, GROUND + player.h, W, H - GROUND - player.h);
    // player (pixel‑art style)
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 5, player.y + 8, 3, 3);
    ctx.fillRect(player.x + 12, player.y + 8, 3, 3);
    // obstacles as spikes
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  function loop() {
    if (running) update();
    draw();
    requestAnimationFrame(loop);
  }

  // Jump on space or mouse click
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.onGround) {
      audioCtx.resume();
      playJumpSound();
      player.vy = JUMP;
      player.onGround = false;
    }
    if (e.key === 'r' && !running) reset();
  });
  canvas.addEventListener('mousedown', () => {
    if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
    }
  });

  loop();
});
