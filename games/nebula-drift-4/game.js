// Neon Asteroid Dodge game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  document.addEventListener('keydown', resumeAudio, { once: true });
  function playSound(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 0.5 + 0.5, // speed factor
    });
  }

  // Player ship (triangle)
  const ship = { w: 40, h: 20, x: W / 2 - 20, y: H - 60, speed: 5 };
  const keys = {};
  document.addEventListener('keydown', e => (keys[e.key] = true));
  document.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (W - size);
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -size, size, speed });
    // Play spawn sound – high-pitched ping
    playSound(800, 'sine', 0.05);
  }

  function rectCircleCollide(rect, circle) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(W - ship.w, ship.x + ship.speed);

    // Update stars (parallax effect)
    for (let s of stars) {
      s.y += s.z * 2; // star speed proportional to depth
      if (s.y > H) {
        s.x = Math.random() * W;
        s.y = 0;
        s.z = Math.random() * 0.5 + 0.5;
      }
    }

    // Spawn asteroids
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = 30 + Math.random() * 30; // frames until next spawn
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision detection
      if (rectCircleCollide({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, { x: a.x + a.size / 2, y: a.y + a.size / 2, r: a.size / 2 })) {
        // Collision sound – low rumble
        playSound(200, 'square', 0.3);
        gameOver = true;
      }
      // Remove off‑screen
      if (a.y > H) {
        asteroids.splice(i, 1);
        score++;
      }
    }
    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Clear with dark space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#09071b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw stars with glow
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.shadowBlur = 0;

    // Ship (neon triangle)
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0ff';
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    // Asteroids (glowing red with radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(1, '#990000');
      ctx.fillStyle = grad;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ff4444';
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f88';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  update();
})();