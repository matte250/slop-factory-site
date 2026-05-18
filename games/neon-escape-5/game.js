// Game based on IDEA.md – Neon Escape
// Canvas element with id "game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element #game not found');
  const ctx = canvas.getContext('2d');
  // Enable smooth glowing effects
  ctx.imageSmoothingEnabled = true;
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player (glowing sphere)
  const player = {
    x: width / 2,
    y: height - 80,
    radius: 15,
    speed: 5,
    color: '#0ff',
    shield: false,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Obstacles – rotating blocks & spikes
  const obstacles = [];
  const obstacleSpawnRate = 90; // frames
  let frameCount = 0;

  // Score & state
  let score = 0;
  let gameOver = false;

  // Utility
  function randRange(min, max) { return Math.random() * (max - min) + min; }

  // Starfield for background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }
  function drawStars() {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6;
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // Move star downwards to create flow
      s.y += 0.3;
      if (s.y > height) s.y = 0;
    }
    ctx.restore();
  }

  // Sound effects using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  window.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  // Ambient background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60; // low rumble
  bgOsc.type = 'sine';
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  bgOsc.start();

  function spawnObstacle() {
    const w = randRange(40, 120);
    const h = 20;
    const x = randRange(0, width - w);
    const speed = randRange(2, 4);
    const type = Math.random() < 0.7 ? 'block' : 'spike';
    obstacles.push({ x, y: -h, w, h, speed, angle: 0, type });
    // Play a brief tone for obstacle spawn
    playTone(500, 80);
  }

  function update() {
    if (gameOver) return;
    // Move player based on keys
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // Keep player inside canvas
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

    // Spawn obstacles
    if (frameCount % obstacleSpawnRate === 0) spawnObstacle();
    frameCount++;

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      o.angle += 0.03; // rotate
      // Remove off‑screen
      if (o.y > height) obstacles.splice(i, 1);
    }

    // Collision detection (simple AABB vs circle)
    for (const o of obstacles) {
      const dx = Math.abs(player.x - (o.x + o.w / 2));
      const dy = Math.abs(player.y - (o.y + o.h / 2));
      if (dx > (o.w / 2 + player.radius) || dy > (o.h / 2 + player.radius)) continue;
      if (dx <= o.w / 2 || dy <= o.h / 2) {
        // direct hit
        if (!player.shield) { gameOver = true; playTone(200, 300); break; }
      } else {
        const cornerDist = (dx - o.w / 2) ** 2 + (dy - o.h / 2) ** 2;
        if (cornerDist <= player.radius ** 2) {
          if (!player.shield) { gameOver = true; playTone(200, 300); break; }
        }
      }
    }

    // Score increments
    score++;
  }

  function drawNeonTunnel() {
    // Enhanced neon tunnel: gradient strips with glow and a subtle starfield
    // Draw faint stars
    drawStars();
    const stripWidth = 30;
    for (let i = 0; i < width / stripWidth; i++) {
      const hue = (i * 45 + frameCount) % 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
      ctx.globalAlpha = 0.07;
      ctx.fillRect(i * stripWidth, 0, stripWidth, height);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawNeonTunnel();

    // Draw obstacles with neon glow
    ctx.globalCompositeOperation = 'lighter';
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.angle);
      ctx.translate(-o.w / 2, -o.h / 2);
      // Neon gradient for obstacles
      const grad = ctx.createLinearGradient(0, 0, o.w, o.h);
      grad.addColorStop(0, o.type === 'block' ? 'rgba(255,255,0,0.7)' : 'rgba(255,0,255,0.7)');
      grad.addColorStop(1, o.type === 'block' ? 'rgba(255,200,0,0.2)' : 'rgba(255,0,200,0.2)');
      ctx.fillStyle = grad;
      if (o.type === 'block') {
        ctx.fillRect(0, 0, o.w, o.h);
      } else {
        // spike – triangle
        ctx.beginPath();
        ctx.moveTo(0, o.h);
        ctx.lineTo(o.w / 2, 0);
        ctx.lineTo(o.w, o.h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Draw player (glowing sphere) with neon aura
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#0ff';
    const grad = ctx.createRadialGradient(player.x, player.y, player.radius / 4, player.x, player.y, player.radius);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // UI – score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
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
