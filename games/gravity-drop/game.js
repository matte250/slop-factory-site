// Gravity Drop – simple canvas game
// The HTML contains <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Ensure audio context is resumed after user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollision() { playTone(120, 300); }
  function playMove() { playTone(440, 100); }
  const width = canvas.width = 400;
  const height = canvas.height = 600;
// Stars for background
const starCount = 100;
const stars = [];
function initStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
}
initStars();

  // Player
  const player = { w: 30, h: 30, x: width / 2 - 15, y: 0, speed: 5, dy: 0 };

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  const obstacleSpeed = 2;
  let lastObstacle = 0;

  // Game state
  let running = true;

  function rectCollision(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function spawnObstacle() {
    const w = 40 + Math.random() * 60;
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -30, w, h: 30 });
  }

  function update(dt) {
  // Update stars
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > height) {
      s.y = 0;
      s.x = Math.random() * width;
    }
  });
    // Move player based on input (keyboard)
    if (keys.ArrowLeft) player.x = Math.max(0, player.x - player.speed);
    if (keys.ArrowRight) player.x = Math.min(width - player.w, player.x + player.speed);

    // Gravity
    player.dy += 0.2; // acceleration
    player.y += player.dy;

    // Obstacles
    obstacles.forEach(o => o.y += obstacleSpeed);
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();

    // Collision detection
    for (const o of obstacles) {
if (rectCollision(player, o) || player.y + player.h > height) {
          playCollision();
          running = false;
          break;
        }
    }

    // Spawn new obstacles
    if (performance.now() - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = performance.now();
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars background
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player (glowing circle)
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Obstacles (rounded rectangles with gradient)
    obstacles.forEach(o => {
      const r = 5;
      const gradObs = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      gradObs.addColorStop(0, '#e74c3c');
      gradObs.addColorStop(1, '#c0392b');
      ctx.fillStyle = gradObs;
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.w - r, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + r);
      ctx.lineTo(o.x + o.w, o.y + o.h - r);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - r, o.y + o.h);
      ctx.lineTo(o.x + r, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.fill();
    });
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      playMove();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Start the game
  requestAnimationFrame(loop);
})();
