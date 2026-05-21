// game.js – minimalist implementation of "Canvas Escape"
// The HTML contains a <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Generate background stars
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Player (glowing orb)
  const player = { x: width / 2, y: height / 2, r: 8, speed: 2 };
  // Trail particles for glow effect
  const particles = [];

  // Simple rotating wall (rectangle) that shrinks over time
  const wall = {
    size: Math.min(width, height) * 0.8,
    angle: 0,
    shrinkRate: 0.02, // per frame
    rotationSpeed: 0.01,
  };

  // Timer (seconds)
  let timeLeft = 30; // seconds
  // Score
  let score = 0;
  const timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) gameOver('time');
  }, 1000);

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (audioCtx.state === 'suspended') audioCtx.resume(); if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  let animationId;
  function gameOver(reason) {
    // Play a tone based on reason
    if (reason === 'collision') {
      playTone(150, 0.3);
    } else if (reason === 'time') {
      playTone(80, 0.5);
    } else {
      playTone(200, 0.2);
    }
    cancelAnimationFrame(animationId);
    clearInterval(timerInterval);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Game Over – ${reason}`, width / 2, height / 2);
  }

  function update() {
    // Update score (survival time)
    score = Math.max(score, Math.floor((30 - timeLeft) * 10));
    // Move player
    const moving = keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (moving) playTone(440, 0.03);
    // Emit particle at player's current position
    particles.push({ x: player.x, y: player.y, r: 3, alpha: 0.6 });
    // Fade out particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].alpha -= 0.02;
      particles[i].r += 0.1;
      if (particles[i].alpha <= 0) particles.splice(i, 1);
    }
    // Cap particle count
    if (particles.length > 120) particles.splice(0, particles.length - 120);

    // Keep player inside canvas bounds
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));

    // Update wall
    wall.angle += wall.rotationSpeed;
    wall.size = Math.max(40, wall.size - wall.shrinkRate);

    // Collision detection (approximate point‑in‑rotated‑square)
    const cx = width / 2, cy = height / 2;
    const s = wall.size / 2;
    const cos = Math.cos(-wall.angle), sin = Math.sin(-wall.angle);
    const dx = player.x - cx, dy = player.y - cy;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    if (Math.abs(rx) > s - player.r || Math.abs(ry) > s - player.r) {
      gameOver('collision');
      return false;
    }
    return true;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient and stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#000014');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw particle trail
    ctx.fillStyle = 'rgba(255,255,150,0.3)';
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw shrinking rotating wall with neon glow
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(wall.angle);
    // Neon gradient for wall fill
    const wallGrad = ctx.createLinearGradient(-wall.size / 2, -wall.size / 2, wall.size / 2, wall.size / 2);
    wallGrad.addColorStop(0, '#0ff');
    wallGrad.addColorStop(1, '#00f');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(-wall.size / 2, -wall.size / 2, wall.size, wall.size);
    // Glow effect
    ctx.shadowColor = 'rgba(0,255,255,0.7)';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(-wall.size / 2, -wall.size / 2, wall.size, wall.size);
    ctx.restore();

    // Draw player (glow effect)
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 3);
    grad.addColorStop(0, 'rgba(255,255,0,0.9)');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // Draw timer
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${timeLeft}s`, 10, 20);
    // Draw score
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, width - 10, 20);
  }

  function loop() {
    if (!update()) return;
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // Start the game
  loop();
})();
