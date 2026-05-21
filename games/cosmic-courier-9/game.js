// Simple side‑scrolling game based on IDEA.md
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCollision() {
    // Low-pitched short burst
    playTone(150, 0.2);
  }

  function playThrust() {
    // High-pitched quick beep
    playTone(400, 0.05);
  }
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 400;

  const ship = { x: 50, y: canvas.height / 2, w: 40, h: 20, vy: 0 };
  let asteroids = [];
  let frames = 0;
  let health = 3;
  const stars = [];
  for (let i = 0; i < 150; i++) {
    // Each star gets a slight leftward speed for parallax effect
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 0.5, speed: 0.2 + Math.random() * 0.3 });
  }
  let gameOver = false;

  // Input handling (up/down arrow or W/S)
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') { keys.up = true; playThrust(); }
    if (e.key === 'ArrowDown' || e.key === 's') { keys.down = true; playThrust(); }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') keys.down = false;
  });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const y = Math.random() * (canvas.height - size);
    const speed = 2 + Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.04; // rotate slowly
    asteroids.push({ x: canvas.width, y, w: size, h: size, speed, angle, rotSpeed });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;
    // Ship movement
    ship.vy = 0;
    if (keys.up) ship.vy = -3;
    if (keys.down) ship.vy = 3;
    ship.y += ship.vy;
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Move stars for parallax
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = canvas.width;
    });

    // Asteroid logic
    if (frames % 90 === 0) spawnAsteroid(); // roughly every 1.5s at 60fps
    asteroids.forEach(a => {
      a.x -= a.speed;
      a.angle += a.rotSpeed;
    });
    asteroids = asteroids.filter(a => a.x + a.w > 0);

    // Collision detection
    asteroids.forEach((a, i) => {
      if (rectIntersect(ship, a)) {
        health -= 1;
        playCollision();
        asteroids.splice(i, 1);
        if (health <= 0) {
          // Crash sound (lower pitch)
          playTone(80, 0.4);
          gameOver = true;
        }
      }
    });

    frames++;
  }

  function draw() {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (already moved in update)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship as triangle with gradient
    const grad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    grad.addColorStop(0, '#0af');
    grad.addColorStop(1, '#04f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids with rotation
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + health, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start
  requestAnimationFrame(loop);
})();
