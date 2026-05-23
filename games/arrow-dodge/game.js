// Arrow Dodge game implementation
// Targets a <canvas id="game"></canvas> element present in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Adjust canvas size to its displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player configuration
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 3,
    dx: 0,
    dy: 0,
  };

  // Arrow configuration
  const arrows = [];
  let arrowSpeed = 2; // base speed, will increase over time
  let spawnInterval = 2000; // ms, will decrease over time
  let lastSpawn = 0;
  let lastUpdate = performance.now();
  let gameOver = false;

  // Helper: random edge spawn
  const spawnArrow = () => {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    const size = 12; // arrow thickness
    let x, y, vx, vy;
    switch (edge) {
      case 0: // top, moving down
        x = Math.random() * canvas.width;
        y = -size;
        vx = 0;
        vy = arrowSpeed;
        break;
      case 1: // right, moving left
        x = canvas.width + size;
        y = Math.random() * canvas.height;
        vx = -arrowSpeed;
        vy = 0;
        break;
      case 2: // bottom, moving up
        x = Math.random() * canvas.width;
        y = canvas.height + size;
        vx = 0;
        vy = -arrowSpeed;
        break;
      case 3: // left, moving right
        x = -size;
        y = Math.random() * canvas.height;
        vx = arrowSpeed;
        vy = 0;
        break;
    }
    arrows.push({ x, y, vx, vy, size });
    // play a short rise tone when an arrow appears
    playTone(300, 0.08);
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  const updatePlayer = () => {
    player.dx = 0;
    player.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
    if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x + player.dx));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y + player.dy));
  };

  const updateArrows = (dt) => {
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Remove off‑screen arrows
      if (a.x < -a.size || a.x > canvas.width + a.size || a.y < -a.size || a.y > canvas.height + a.size) {
        arrows.splice(i, 1);
      }
    }
  };

  const checkCollision = () => {
    for (const a of arrows) {
      // Simple AABB vs circle test
      const nearestX = Math.max(a.x - a.size / 2, Math.min(player.x, a.x + a.size / 2));
      const nearestY = Math.max(a.y - a.size / 2, Math.min(player.y, a.y + a.size / 2));
      const dx = player.x - nearestX;
      const dy = player.y - nearestY;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        gameOver = true;
        // play collision sound (low buzz)
        playTone(100, 0.3);
        break;
      }
    }
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#20232a');
    bgGrad.addColorStop(1, '#28343f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Player with radial gradient
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.2, player.x, player.y, player.radius);
    playerGrad.addColorStop(0, '#78caff');
    playerGrad.addColorStop(1, '#0066cc');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw arrows as triangles pointing in travel direction with gradient shade
    for (const a of arrows) {
      const angle = Math.atan2(a.vy, a.vx);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(angle);
      const arrowGrad = ctx.createLinearGradient(-a.size / 2, 0, a.size / 2, 0);
      arrowGrad.addColorStop(0, '#ff9999');
      arrowGrad.addColorStop(1, '#ff1111');
      ctx.fillStyle = arrowGrad;
      ctx.beginPath();
      // triangle pointing right (0 rad) before rotation
      ctx.moveTo(a.size / 2, 0);
      ctx.lineTo(-a.size / 2, -a.size / 2);
      ctx.lineTo(-a.size / 2, a.size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = (now) => {
    const dt = (now - lastUpdate) / 16.666; // approx 60fps multiplier
    lastUpdate = now;
    if (!gameOver) {
      // spawn logic
      if (now - lastSpawn > spawnInterval) {
        spawnArrow();
        lastSpawn = now;
        // increase difficulty gradually
        arrowSpeed *= 1.02;
        spawnInterval = Math.max(500, spawnInterval * 0.98);
      }
      updatePlayer();
      updateArrows(dt);
      checkCollision();
    }
    draw();
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
