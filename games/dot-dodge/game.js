// Simple "Dot Dodge" canvas game
// Canvas with id="game" expected in the host HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction (required by browsers)
  document.body.addEventListener('click', () => audioCtx.resume(), {once: true});
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
  // Set a default size if not defined in HTML
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const player = { x: canvas.width / 2, y: canvas.height / 2, r: 8, speed: 4 };
  const obstacles = [];
  let score = 0;
  let gameOver = false;
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms

  // Input handling (keyboard & mouse)
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  function update(dt) {
    // Player movement via arrow keys when mouse not moving
    if (!keys['ArrowLeft'] && !keys['ArrowRight'] && !keys['ArrowUp'] && !keys['ArrowDown']) {
      // no keyboard input, keep mouse position
    } else {
      if (keys['ArrowLeft']) player.x -= player.speed;
      if (keys['ArrowRight']) player.x += player.speed;
      if (keys['ArrowUp']) player.y -= player.speed;
      if (keys['ArrowDown']) player.y += player.speed;
    }
    // Keep player inside canvas
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      // Remove if out of bounds
if (o.x < -o.r || o.x > canvas.width + o.r || o.y < -o.r || o.y > canvas.height + o.r) {
            obstacles.splice(i, 1);
            score++;
            // Play a short dodge sound
            playTone(300, 0.05);
            continue;
          }
      // Collision detection
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      const distSq = dx * dx + dy * dy;
      const radSum = o.r + player.r;
      if (distSq < radSum * radSum) {
        // Play collision sound
        playTone(100, 0.2);
        gameOver = true;
      }
    }
  }

  function spawnObstacle() {
    const side = Math.floor(Math.random() * 4);
    const r = 10 + Math.random() * 10;
    let x, y, vx, vy;
    const speed = 0.1 + Math.random() * 0.2; // pixels per ms
    switch (side) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -r;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // right
        x = canvas.width + r;
        y = Math.random() * canvas.height;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + r;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      case 3: // left
        x = -r;
        y = Math.random() * canvas.height;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    obstacles.push({ x, y, vx, vy, r });
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player with radial gradient
    const playerGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r);
    playerGrad.addColorStop(0, '#4af');
    playerGrad.addColorStop(1, '#00f');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles with radial gradients
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#f00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score with shadow
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.shadowBlur = 0;

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
