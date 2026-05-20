// Simple Canvas Dodge game
// Assumes an existing <canvas id="game"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player ship
  const player = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 4,
    dx: 0,
  };

  // Asteroid pool
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 120; // frames
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  // Ensure audio context can play after user interaction
  window.addEventListener('keydown', e => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const x = Math.random() * (width - size);
    const y = -size;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y, size, speed });
    // Play a short blip when an asteroid appears
    playTone(200, 0.05, 'square');
  }

  function update() {
    if (gameOver) return;
    // Move player
    player.dx = 0;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x + player.dx));

    // Spawn asteroids
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
      // gradually increase difficulty
      if (spawnInterval > 30) spawnInterval -= 1;
    } else {
      spawnTimer--;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      const cx = a.x + a.size / 2;
      const cy = a.y + a.size / 2;
      const dx = px - cx;
      const dy = py - cy;
      const distance = Math.hypot(dx, dy);
if (distance < a.size / 2 + Math.max(player.w, player.h) / 2) {
          gameOver = true;
          // Play explosion / crash sound
          playTone(100, 0.3, 'triangle');
          break;
        }
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Draw player (triangle ship) with gradient
    const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const radGrad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      radGrad.addColorStop(0, '#777');
      radGrad.addColorStop(1, '#222');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
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
