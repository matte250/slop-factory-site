// Minimal endless runner game with enhanced graphics
// Targets a <canvas id="game"></canvas> in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or window
  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // ---- Audio setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a short beep
  const playBeep = (freq, duration = 0.1, type = 'square') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrustSound = () => playBeep(300);
  const playCollectSound = () => playBeep(800);
  const playCrashSound = () => playBeep(150, 0.3, 'sawtooth');
  // Resume audio context on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('mousedown', resumeAudio);
    window.removeEventListener('touchstart', resumeAudio);
  };
  window.addEventListener('mousedown', resumeAudio);
  window.addEventListener('touchstart', resumeAudio);

  // ---- Visual enhancements ----
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.2 + Math.random() * 0.3,
    });
  }

  // ---- Game entities ----
  const player = {
    x: 60,
    y: canvas.height / 2,
    radius: 10,
    vy: 0,
    color: '#0ff',
  };
  const GRAVITY = 0.4;
  const THRUST = -9;
  const asteroids = [];
  const orbs = [];
  let asteroidTimer = 0;
  let orbTimer = 0;
  let score = 0;
  let running = true;

  // Input handling – click / tap applies upward thrust
  const applyThrust = () => {
    if (running) {
      player.vy = THRUST;
      playThrustSound();
    }
  };
  canvas.addEventListener('mousedown', applyThrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); applyThrust(); });

  // Helper: spawn an asteroid
  const spawnAsteroid = () => {
    const size = 15 + Math.random() * 20;
    asteroids.push({
      x: canvas.width + size,
      y: Math.random() * (canvas.height - size),
      radius: size,
      speed: 3 + Math.random() * 2,
      color: '#f44',
    });
  };

  const spawnOrb = () => {
    const size = 8;
    orbs.push({
      x: canvas.width + size,
      y: Math.random() * (canvas.height - size),
      radius: size,
      speed: 3,
      color: '#ff0',
    });
  };

  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  const update = () => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // Keep player within vertical bounds (optional bounce off top)
    if (player.y < player.radius) {
      player.y = player.radius;
      player.vy = 0;
    }
    // Game over if falls below bottom
    if (player.y > canvas.height - player.radius) {
      running = false;
    }

    // Asteroid logic
    asteroidTimer--;
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = 80 + Math.random() * 40; // frames until next
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
      // Collision with player
        if (distance(player.x, player.y, a.x, a.y) < player.radius + a.radius) {
          playCrashSound();
          running = false;
          break;
        }
    }

    // Orb logic (collectibles)
    orbTimer--;
    if (orbTimer <= 0) {
      spawnOrb();
      orbTimer = 120 + Math.random() * 60;
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x -= o.speed;
      if (o.x + o.radius < 0) orbs.splice(i, 1);
        if (distance(player.x, player.y, o.x, o.y) < player.radius + o.radius) {
          playCollectSound();
          score += 10;
          orbs.splice(i, 1);
        }
    }
    // Increment score over time
    score += 0.05;
  };

  const draw = () => {
    // Space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw moving stars (parallax)
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
      star.x -= star.speed;
      if (star.x < 0) star.x = canvas.width;
    });

    // Draw player as a simple ship triangle with thrust glow
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(Math.atan2(player.vy, 5)); // tilt based on vertical velocity
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(-player.radius, -player.radius * 0.8);
    ctx.lineTo(player.radius, 0);
    ctx.lineTo(-player.radius, player.radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids with radial gradient for depth
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#8a2f2f');
      grad.addColorStop(1, '#300000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw orbs with glow effect
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    orbs.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    if (running) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // draw final state with overlay
    }
  };
  loop();
})();
