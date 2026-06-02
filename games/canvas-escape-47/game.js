// Simple Canvas Escape game
// Ship controlled by arrow keys, avoid moving obstacles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ship properties
  const ship = { x: 50, y: height / 2, w: 20, h: 20, speed: 4 };
  const keys = {};

  // Obstacles array
  const obstacles = [];
  const obstacleSpeed = 2;
  const obstacleSpawnInterval = 1000; // ms
  // Starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      alpha: Math.random() * 0.6 + 0.2,
    });
  }
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Clamp to canvas
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn obstacles
    if (performance.now() - lastSpawn > obstacleSpawnInterval) {
      const size = 20 + Math.random() * 30;
      obstacles.push({ x: width, y: Math.random() * (height - size), w: size, h: size });
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Remove off-screen
      if (o.x + o.w < 0) {
          obstacles.splice(i, 1);
          score++;
          playTone(800, 0.08); // point sound
        } else if (collides(ship, o)) {
          playTone(200, 0.3); // crash sound
          gameOver = true;
        }
    }
  }

  function collides(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // Dark background
    ctx.fillStyle = '#0b0b1f';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    // Ship as triangle
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Obstacles as circles with gradient
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.w / 2, o.y + o.h / 2, o.w / 4, o.x + o.w / 2, o.y + o.h / 2, o.w / 2);
      grad.addColorStop(0, 'rgba(255,80,80,0.9)');
      grad.addColorStop(1, 'rgba(200,0,0,0.5)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
