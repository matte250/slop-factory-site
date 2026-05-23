// Neon Dodge – minimal HTML Canvas game
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Audio setup – simple tones using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur / 1000);
    osc.start(now);
    osc.stop(now + dur / 1000);
  }

  // Player (glowing orb)
  const player = {
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 50,
    speed: 5,
    color: '#0ff',
  };

  // Obstacles
  const obstacles = [];
  const obstacleW = 40;
  const obstacleH = 20;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let speedIncrement = 0.02; // acceleration per frame
  let obstacleSpeed = 2;

  // Score
  let score = 0;
  let startTime = performance.now();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    const x = Math.random() * (width - obstacleW);
    obstacles.push({ x, y: -obstacleH, w: obstacleW, h: obstacleH });
    // Play a short rise tone for each obstacle
    playTone(300 + Math.random() * 200, 100);
  }

  function update(dt) {
    // Player movement (A/D or ArrowLeft/ArrowRight)
    if (keys['a'] || keys['ArrowLeft']) player.x -= player.speed;
    if (keys['d'] || keys['ArrowRight']) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      if (o.y > height) obstacles.splice(i, 1); // off‑screen
      // Collision detection
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // Game over – play crash tone then stop loop
        playTone(800, 300);
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
    }

    // Increase difficulty
    obstacleSpeed += speedIncrement * dt;
    // Update score
    score = (performance.now() - startTime) / 1000;
  }

  function draw() {
    // Background – vertical neon gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a001f'); // dark purple
    bgGrad.addColorStop(1, '#001030'); // deep blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Neon grid – brighter lines with glow
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Reset shadow for subsequent drawing
    ctx.shadowBlur = 0;

    // Draw player – glowing orb with radial gradient
    const grad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 4,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#005');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles – neon blocks with glow
    obstacles.forEach(o => {
      ctx.save();
      ctx.shadowColor = '#f44';
      ctx.shadowBlur = 10;
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#ff4444');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.restore();
    });

    // Score display
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
