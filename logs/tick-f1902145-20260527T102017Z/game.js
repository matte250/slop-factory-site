// Minimal Glowball game implementation
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, volume = 0.1, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now + duration);
  };
  const width = canvas.width = canvas.offsetWidth || 800;
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#003');
  const height = canvas.height = canvas.offsetHeight || 600;

  // Player ball
  const trail = [];
  const ball = {
    radius: 10,
    x: width / 2,
    y: height - 30,
    speed: 300, // pixels per second
    color: '#00ff99'
  };

  // Falling shapes
  const shapes = [];
  const shapeSize = 30;
  let shapeSpawnTimer = 0;
  let shapeSpawnInterval = 1.0; // seconds, will decrease over time
  let shapeFallSpeed = 100; // initial speed (px/s)

  // Input handling
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  let lastTime = performance.now();
  let elapsed = 0;
  let gameOver = false;

function spawnShape() {
    // play a subtle spawn sound
    playSound(200 + Math.random() * 200, 0.02, 0.05);
    const rotation = 0;
    const rotationSpeed = (Math.random() * 2 - 1) * Math.PI; // radians per second
    const color = `hsl(${Math.random()*360},70%,60%)`;
    const x = Math.random() * (width - shapeSize) + shapeSize / 2;
    shapes.push({ x, y: -shapeSize, size: shapeSize, rotation, rotationSpeed, color });
}

  function update(dt) {
    // Add current ball position to trail
    trail.push({x: ball.x, y: ball.y, life: 0.5});
    // Fade out old trail points
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].life -= dt;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }
    if (gameOver) return;
    // Move player
    if (keys.left) ball.x -= ball.speed * dt;
    if (keys.right) ball.x += ball.speed * dt;
    ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));

    // Spawn shapes
    shapeSpawnTimer += dt;
    if (shapeSpawnTimer >= shapeSpawnInterval) {
      spawnShape();
      shapeSpawnTimer = 0;
      // gradually increase difficulty
      shapeSpawnInterval = Math.max(0.2, shapeSpawnInterval * 0.97);
      shapeFallSpeed *= 1.02;
    }

    // Update shapes
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      s.y += shapeFallSpeed * dt;
      // rotate shape
      s.rotation += s.rotationSpeed * dt;
      // collision detection (circle‑rect approximate)
      const dx = Math.abs(ball.x - s.x);
      const dy = Math.abs(ball.y - s.y);
      if (dx < ball.radius + s.size / 2 && dy < ball.radius + s.size / 2) {
        gameOver = true;
        // play collision / game over sound
        playSound(100, 0.2, 0.3);
      }
      // remove off‑screen shapes
      if (s.y - s.size > height) shapes.splice(i, 1);
    }
    elapsed += dt;
  }

  function draw() {
    // background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // draw motion trail
    ctx.fillStyle = ball.color;
    trail.forEach(p => {
      const alpha = Math.max(p.life, 0);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ball.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // draw rotating shapes with color
    shapes.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.fillStyle = s.color;
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
      ctx.restore();
    });

    // draw ball with glow
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Time: ${elapsed.toFixed(2)}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff4444';
      ctx.textAlign = 'center';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
