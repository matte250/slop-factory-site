// Simple endless runner based on IDEA.md
// Canvas with id "game" must exist in the HTML.
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  let audioCtx;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  function playTone(freq, dur) {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur);
  }
  function playJumpSound() { playTone(440, 0.08); }
  function playGameOverSound() { playTone(150, 0.4); }
  let gameOverSoundPlayed = false;
  // Full‑screen canvas
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Orb (player)
  const orb = {
    x: canvas.width * 0.2,
    y: canvas.height * 0.5,
    r: 20,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    color: '#0ff',
  };

  // Obstacles – simple rectangles
  const obstacles = [];
  const obstacleWidth = 30;
  const obstacleGap = 200; // horizontal distance between obstacles
  let lastObstacleX = canvas.width;

  let score = 0;
  let alive = true;

  function spawnObstacle() {
    const height = Math.random() * (canvas.height * 0.6) + 20;
    const y = canvas.height - height;
    obstacles.push({ x: canvas.width, y, w: obstacleWidth, h: height });
    lastObstacleX = canvas.width;
  }

  function reset() {
    orb.y = canvas.height * 0.5;
    orb.vy = 0;
    obstacles.length = 0;
    score = 0;
    alive = true;
    lastObstacleX = canvas.width;
  }

  function update() {
    if (!alive) return;
    // Orb physics
    orb.vy += orb.gravity;
    orb.y += orb.vy;
    // Prevent going above canvas
    if (orb.y < orb.r) {
      orb.y = orb.r;
      orb.vy = 0;
    }
    // Lose if falls below bottom
    if (orb.y - orb.r > canvas.height) {
      alive = false;
      if (!gameOverSoundPlayed) { playGameOverSound(); gameOverSoundPlayed = true; }
    }
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5; // speed
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision (simple AABB vs circle)
      const cx = orb.x, cy = orb.y, r = orb.r;
      const nearestX = Math.max(o.x, Math.min(cx, o.x + o.w));
      const nearestY = Math.max(o.y, Math.min(cy, o.y + o.h));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
      if (dx * dx + dy * dy < r * r) alive = false;
    }
    // Spawn new obstacles
    if (lastObstacleX - (obstacles[obstacles.length - 1]?.x ?? 0) > obstacleGap) {
      spawnObstacle();
    }
    // Score by time
    score++;
  }

  // Global star field for background
const stars = [];
function initStars(count = 100) {
  stars.length = 0;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
}
initStars();

function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#00172d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars (moving left for parallax)
    ctx.fillStyle = '#fff';
    stars.forEach(st => {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
      st.x -= st.speed;
      if (st.x < 0) st.x = canvas.width;
    });

    // Draw orb with glow
    const orbGrad = ctx.createRadialGradient(orb.x, orb.y, orb.r * 0.3, orb.x, orb.y, orb.r * 2);
    orbGrad.addColorStop(0, '#a0ffff');
    orbGrad.addColorStop(1, '#00aaff');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles with gradient and rounded corners
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#ff5555');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      const radius = 5;
      ctx.beginPath();
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.w - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      ctx.lineTo(o.x + o.w, o.y + o.h - radius);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      ctx.lineTo(o.x + radius, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 30);
    // Game over overlay
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Input – click or tap to jump / restart
  canvas.addEventListener('pointerdown', () => {
    if (!alive) {
      reset();
      gameOverSoundPlayed = false; // allow next game over sound
    } else {
      orb.vy = orb.jumpStrength;
      playJumpSound();
    }
  });

  // Start game loop
  loop();
})();
