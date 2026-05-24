// Game: Neon Runner (endless runner)
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // Player circle
  const player = {
    x: 50,
    y: HEIGHT / 2,
    radius: 12,
    speedY: 0,
    maxSpeed: 4,
  };

  // Obstacles array
  const obstacles = [];
  let obstacleSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let speed = 2; // base horizontal speed of obstacles
  let speedIncrease = 0.001; // per ms
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    if (gameOver) return;
    // Player vertical movement
    if (keys['ArrowUp'] || keys['w']) {
      player.speedY = -player.maxSpeed;
      playTone(660, 80); // up move sound
    } else if (keys['ArrowDown'] || keys['s']) {
      player.speedY = player.maxSpeed;
      playTone(440, 80); // down move sound
    }
    else player.speedY = 0;
    player.y += player.speedY;
    // Clamp within canvas
    if (player.y < player.radius) player.y = player.radius;
    if (player.y > HEIGHT - player.radius) player.y = HEIGHT - player.radius;

    // Spawn obstacles
    if (Date.now() - lastSpawn > obstacleSpawnInterval) {
      const height = 20 + Math.random() * 60;
      const gap = 80 + Math.random() * 40; // vertical gap for player to pass
      const y = Math.random() * (HEIGHT - height - gap);
      obstacles.push({ x: WIDTH, y, w: 20, h: height });
      obstacles.push({ x: WIDTH, y: y + height + gap, w: 20, h: HEIGHT - (y + height + gap) });
      lastSpawn = Date.now();
    }

    // Move obstacles leftward
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed * dt / 16; // normalize to 60fps base
      if (ob.x + ob.w < 0) obstacles.splice(i, 1);
    }

    // Increase speed gradually
    speed += speedIncrease * dt;

    // Collision detection (circle vs rectangle)
    for (const ob of obstacles) {
      const nearestX = Math.max(ob.x, Math.min(player.x, ob.x + ob.w));
      const nearestY = Math.max(ob.y, Math.min(player.y, ob.y + ob.h));
      const dx = player.x - nearestX;
      const dy = player.y - nearestY;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        playTone(200, 300); // collision sound
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Dark neon background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw player with neon glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Draw obstacles with neon glow
    ctx.save();
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 10;
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#f44');
    grad.addColorStop(1, '#800');
    ctx.fillStyle = grad;
    for (const ob of obstacles) {
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }
    ctx.restore();
    if (gameOver) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
