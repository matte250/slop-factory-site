// Minimal Cosmic Drift game implementation
// Assumes a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Game state
  let ship = { x: width / 2, y: height / 2, angle: 0, speed: 2, radius: 10 };
  const particles = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // Input handling – mouse & touch set ship direction
  // Audio setup (Web Audio API)
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure audio context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('click', resumeAudio, { once: true });
  canvas.addEventListener('touchstart', resumeAudio, { once: true });

  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };

  const playCollect = () => playTone(600, 100);
  const playCrash = () => playTone(200, 300);

  const setDirection = (clientX, clientY) => {
  const setDirection = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    ship.angle = Math.atan2(my - ship.y, mx - ship.x);
  };
  canvas.addEventListener('mousemove', e => setDirection(e.clientX, e.clientY));
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    setDirection(touch.clientX, touch.clientY);
  }, { passive: false });

  // Helper functions
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const spawnParticle = () => {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 3,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  };
  const spawnAsteroid = () => {
    const size = 15 + Math.random() * 25;
    asteroids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: size,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
    });
  };

  // Starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Initial spawns
  for (let i = 0; i < 30; i++) spawnParticle();
  for (let i = 0; i < 5; i++) spawnAsteroid();

  const update = () => {
    if (gameOver) return;
    // Move ship forward
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    // Boundary lose condition
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      gameOver = true;
    }

    // Update particles (collect)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      // Wrap around edges for particles
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      // Collection check
      if (dist(ship, p) < ship.radius + p.radius) {
        score++;
        particles.splice(i, 1);
        spawnParticle();
        playCollect();
      }
    }

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // Bounce off walls
      if (a.x < a.radius || a.x > width - a.radius) a.vx *= -1;
      if (a.y < a.radius || a.y > height - a.radius) a.vy *= -1;
      // Collision with ship
      if (dist(ship, a) < ship.radius + a.radius) {
        playCrash();
        gameOver = true;
      }
    }
  };

  const draw = () => {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      // slight flicker via random alpha each frame
      ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0; // reset

    // Draw particles (glowing)
    ctx.fillStyle = '#0ff';
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.2,
        a.x, a.y, a.radius
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship with thrust effect
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(-ship.radius, 0);
    ctx.lineTo(-ship.radius - 6, -4);
    ctx.lineTo(-ship.radius - 6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Start loop
  requestAnimationFrame(loop);
})();
