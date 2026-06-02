// Simple endless runner for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;

  const groundY = height - 40;
  const player = {x: 50, y: groundY - 30, w: 30, h: 30, vy: 0, jumpForce: -8, onGround: true};
  const gravity = 0.4;
  const obstacles = [];
  const powerUps = [];
  const clouds = [];
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  let frame = 0;
  let score = 0;
  let running = true;

  // Helper to draw rounded rectangles
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    obstacles.push({x: width, y: groundY - size, w: size, h: size});
  };

  const spawnPowerUp = () => {
    const size = 15;
    powerUps.push({x: width, y: groundY - 80, w: size, h: size, collected: false});
  };

  const spawnCloud = () => {
    const w = 60 + Math.random() * 40;
    const h = 30 + Math.random() * 20;
    clouds.push({x: width, y: 20 + Math.random() * 80, w, h, speed: 1 + Math.random() * 1});
  };

  const rectIntersect = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    if (!running) return;
    frame++;
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= groundY) { player.y = groundY - player.h; player.vy = 0; player.onGround = true; }
    else player.onGround = false;

    // Spawn logic
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 500 === 0) spawnPowerUp();
    if (frame % 300 === 0) spawnCloud();

    // Move obstacles
    obstacles.forEach(o => o.x -= 5);
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // Move power‑ups
    powerUps.forEach(p => p.x -= 5);
    while (powerUps.length && powerUps[0].x + powerUps[0].w < 0) powerUps.shift();

    // Move clouds (slow background)
    clouds.forEach(c => c.x -= c.speed);
    while (clouds.length && clouds[0].x + clouds[0].w < 0) clouds.shift();

    // Collision detection
    for (const o of obstacles) {
      if (rectIntersect(player, o)) {
        // Collision sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playTone(150, 0.3);
        running = false;
        break;
      }
    }
    for (const p of powerUps) {
      if (!p.collected && rectIntersect(player, p)) {
        p.collected = true;
        score += 10;
        // Power‑up sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playTone(660, 0.15);
      }
    }
  };

  const draw = () => {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      roundRect(c.x, c.y, c.w, c.h, c.h / 2);
    });

    // Ground with simple texture
    ctx.fillStyle = '#3B7A57';
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = '#2E5C44';
    for (let x = 0; x < width; x += 20) {
      ctx.fillRect(x, groundY, 10, 5);
    }

    // Player – a cute character (body + head)
    ctx.fillStyle = '#FFD700'; // body
    roundRect(player.x, player.y, player.w, player.h, 5);
    // head
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y - player.h / 2, player.h / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFCC99';
    ctx.fill();

    // Obstacles – spikes (triangles)
    ctx.fillStyle = '#B22222';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // Power‑ups – stars
    ctx.fillStyle = '#FFD700';
    powerUps.filter(p => !p.collected).forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(0, -p.w / 2);
        ctx.rotate(Math.PI / 5);
        ctx.lineTo(0, -p.w / 4);
        ctx.rotate(Math.PI / 5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  };

  const handleJump = () => {
    if (player.onGround) {
      // Ensure audio context is running
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playTone(440, 0.1); // jump sound
      player.vy = player.jumpForce;
      player.onGround = false;
    }
  };

  document.addEventListener('keydown', e => { if (e.code === 'Space') handleJump(); });
  canvas.addEventListener('click', handleJump);

  // Start
  requestAnimationFrame(loop);
})();
