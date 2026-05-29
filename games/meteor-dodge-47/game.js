// Simple Meteor Dodge game
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Background hum
  setInterval(() => playTone(80, 200), 3000);

  // Ship (triangle)
  const ship = { w: 40, h: 30, x: width / 2, y: height - 30, speed: 5 };

  // Meteors
  const meteors = [];
  let spawnTimer = 0;
  let spawnInterval = 2000; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

    // Stars background
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
    }

  // Input
  const keys = {};
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  window.addEventListener('click', resumeAudio);

  function update(dt) {
    if (gameOver) return;
    // Move ship (centered)
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Spawn meteors
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      const size = 20 + Math.random() * 30;
      meteors.push({
        x: Math.random() * (width - size),
        y: -size,
        w: size,
        h: size,
        speed: 1 + Math.random() * 2 + score / 5000
      });
      // Gradually increase difficulty
      spawnInterval = Math.max(300, spawnInterval * 0.98);
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off‑screen
      if (m.y > height) meteors.splice(i, 1);
      // Collision detection (simple AABB)
      if (!gameOver &&
          m.x < ship.x + ship.w && m.x + m.w > ship.x &&
          m.y < ship.y + ship.h && m.y + m.h > ship.y) {
        gameOver = true;
        // Play collision sound
        playTone(440, 300);
      }
    }
    score += dt;
  }

  function draw() {
    // Space background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Meteors (circles with gradient)
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, m.w * 0.2, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
      grad.addColorStop(0, '#ffa');
      grad.addColorStop(1, '#f44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
