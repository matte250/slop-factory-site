// game.js – Simple Neon Escape implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  // Ambient background hum
  const ambientGain = audioCtx.createGain();
  ambientGain.gain.value = 0.02;
  const ambientOsc = audioCtx.createOscillator();
  ambientOsc.frequency.value = 30;
  ambientOsc.type = 'sine';
  ambientOsc.connect(ambientGain).connect(audioCtx.destination);
  ambientOsc.start();
  // Fit canvas to its container or full window
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player (glowing particle)
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    r: 8,
    vx: 0,
    vy: 0,
    speed: 4,
    boost: -8,
    color: '#0ff',
  };

  const keys = { ArrowLeft: false, ArrowRight: false, Space: false };
  window.addEventListener('keydown', e => {
    // Ensure audio context is resumed on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space') {
      // Play boost sound
      playTone(600, 0.08);
    }
    // Ensure audio context is resumed on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    else if (e.code === 'ArrowRight') keys.ArrowRight = true;
    else if (e.code === 'Space') keys.Space = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    else if (e.code === 'ArrowRight') keys.ArrowRight = false;
    else if (e.code === 'Space') keys.Space = false;
  });

  // Obstacles (neon rectangles)
  // Starfield for background effect
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5,
    });
  }

  const updateStars = () => {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
  };

  const drawStars = () => {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const obstacles = [];
  const obstacleFrequency = 120; // frames
  let frameCount = 0;

  const spawnObstacle = () => {
    const width = 40 + Math.random() * 80;
    const x = Math.random() * (canvas.width - width);
    const speed = 2 + Math.random() * 2;
    obstacles.push({ x, y: -20, w: width, h: 20, speed, color: '#f0f' });
  };

  const update = () => {
    // Update starfield
    updateStars();
    // Player movement
    if (keys.ArrowLeft) player.vx = -player.speed;
    else if (keys.ArrowRight) player.vx = player.speed;
    else player.vx = 0;
    if (keys.Space) player.vy = player.boost;
    // gravity
    player.vy += 0.3;
    player.x += player.vx;
    player.y += player.vy;
    // Keep within bounds horizontally
    if (player.x < player.r) player.x = player.r;
    if (player.x > canvas.width - player.r) player.x = canvas.width - player.r;

    // Obstacles move down (canvas scroll upward)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > canvas.height) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    if (frameCount % obstacleFrequency === 0) spawnObstacle();
    frameCount++;
  };

  const drawNeonGrid = () => {
    // Neon grid with glow effect
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    const step = 40;
    ctx.strokeStyle = 'rgba(0,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const draw = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background gradient (dark neon)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw moving starfield
    drawStars();
    // Set additive blending for neon effects
    ctx.globalCompositeOperation = 'lighter';
    // Draw neon grid with glow
    drawNeonGrid();
    // Draw obstacles with neon glow
    obstacles.forEach(o => {
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // Reset shadow blur
    ctx.shadowBlur = 0;
    // Draw player with inner glow
    const grad = ctx.createRadialGradient(
      player.x,
      player.y,
      0,
      player.x,
      player.y,
      player.r * 4
    );
    grad.addColorStop(0, player.color);
    grad.addColorStop(0.6, 'rgba(0,255,255,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // Restore default composite mode
    ctx.globalCompositeOperation = 'source-over';
  };

  const checkCollision = () => {
    for (const o of obstacles) {
      // simple AABB vs circle collision
      const dx = Math.max(o.x - player.x, Math.min(player.x - (o.x + o.w), 0));
      const dy = Math.max(o.y - player.y, Math.min(player.y - (o.y + o.h), 0));
      if (dx * dx + dy * dy < player.r * player.r) return true;
    }
    // Fall off bottom
    if (player.y - player.r > canvas.height) return true;
    return false;
  };

  const loop = () => {
    update();
    draw();
    if (checkCollision()) {
        // Play collision sound
        playTone(200, 0.3);
      // Game over – simple restart
      alert('Game Over');
      // Reset state
      player.x = canvas.width / 2;
      player.y = canvas.height - 60;
      player.vx = player.vy = 0;
      obstacles.length = 0;
      frameCount = 0;
    } else {
      requestAnimationFrame(loop);
    }
  };

  requestAnimationFrame(loop);
})();
