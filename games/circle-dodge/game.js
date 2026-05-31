// Simple Circle Dodge game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  function playTone(freq, length) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + length);
  }
  // Set canvas size to fill its container or default
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Player square
  const player = {
    size: 20,
    x: canvas.width / 2 - 10,
    y: canvas.height / 2 - 10,
    speed: 4,
    color: '#00ff00',
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Circle enemies
  const circles = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  function spawnCircle() {
    const radius = 10;
    // Random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -radius;
        break;
      case 1: // right
        x = canvas.width + radius;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + radius;
        break;
      case 3: // left
        x = -radius;
        y = Math.random() * canvas.height;
        break;
    }
    // Random direction roughly towards center
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x) + (Math.random() - 0.5) * 0.5;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
  circles.push({ x, y, vx, vy, radius, color: '#ff4444' });
    // Play spawn sound
    playTone(300, 0.05);
    }

  function update(dt) {
    // Move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Spawn circles based on time and difficulty
    const now = performance.now();
    if (now - lastSpawn > spawnInterval) {
      spawnCircle();
      lastSpawn = now;
    }
    // Ramp difficulty (decrease interval, increase max speed)
    const elapsed = (now - startTime) / 1000; // seconds
    spawnInterval = Math.max(300, 2000 - elapsed * 20); // down to 300ms
    // Update circles
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.x += c.vx;
      c.y += c.vy;
      c.radius += 0.03; // expand slowly
      // Remove if far off screen
      if (c.x < -c.radius * 2 || c.x > canvas.width + c.radius * 2 || c.y < -c.radius * 2 || c.y > canvas.height + c.radius * 2) {
        circles.splice(i, 1);
      }
    }

    // Collision detection
    for (const c of circles) {
      const nearestX = Math.max(player.x, Math.min(c.x, player.x + player.size));
      const nearestY = Math.max(player.y, Math.min(c.y, player.y + player.size));
      const dx = c.x - nearestX;
      const dy = c.y - nearestY;
if (dx * dx + dy * dy < c.radius * c.radius) {
          // Play collision sound
          playTone(120, 0.2);
          gameOver = true;
          break;
        }
    }

    score = Math.floor(elapsed);
  }

  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1a2a3a');
    bgGrad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw player with rounded corners and glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.size, player.size, 4);
    ctx.fill();
    ctx.restore();
    // Draw circles with radial gradient and slight glow
    for (const c of circles) {
      ctx.save();
      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.3, c.x, c.y, c.radius);
      grad.addColorStop(0, 'rgba(255,100,100,0.8)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.shadowColor = 'rgba(255,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastTime || timestamp);
      update(dt);
      draw();
      lastTime = timestamp;
      requestAnimationFrame(loop);
    } else {
      draw(); // final draw with overlay
    }
  }
  let lastTime = 0;
  requestAnimationFrame(loop);
})();
