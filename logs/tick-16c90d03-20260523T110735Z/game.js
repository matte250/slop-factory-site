// Simple Meteor Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  canvas.addEventListener('click', resumeAudio, { once: true });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Background music loop (low hum)
  let musicInterval = null;
  function startMusic() {
    if (musicInterval) return;
    musicInterval = setInterval(() => playTone(80, 0.5), 2000);
  }
  // Start music after first interaction
  window.addEventListener('keydown', startMusic, { once: true });
  canvas.addEventListener('click', startMusic, { once: true });

  // Ship (triangle)
  const ship = { w: 40, h: 30, x: width / 2, y: height - 40, speed: 5 };

  // Meteors array
  const meteors = [];
  const meteorSpawnInterval = 800; // ms
  let lastSpawn = 0;
  let score = 0;
  let lives = 3;
  let gameOver = false;

  // Starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5
  }));

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: Math.random() * 2 + 2 });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship movement (arrow keys)
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Clamp ship position
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Collision with ship
      if (m.x < ship.x + ship.w && m.x + m.w > ship.x && m.y < ship.y + ship.h && m.y + m.h > ship.y) {
          // Play collision sound
          playTone(200, 0.2);
          lives--;
          meteors.splice(i, 1);
          if (lives <= 0) gameOver = true;
          continue;
      }
      // Remove off-screen meteors, increment score
      if (m.y > height) {
        meteors.splice(i, 1);
          // Play point sound
          playTone(400, 0.05);
          score++;
      }
    }
  }

  function draw() {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        0,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#ff7733');
      grad.addColorStop(1, '#aa3300');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
