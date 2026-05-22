// Simple Nebula Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playSound(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Full‑screen canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game constants
  const SHIP_W = 40,
        SHIP_H = 20,
        SHIP_SPEED = 4,
        BOOST_SPEED = 8,
        BOOST_COST = 0.5,
        BOOST_REGEN = 0.2,
        OBSTACLE_W = 30,
        OBSTACLE_H = 100,
        ORB_R = 8,
        SPAWN_RATE = 0.02; // per frame

  // Game state
  const ship = { x: canvas.width / 2, y: canvas.height - 60, w: SHIP_W, h: SHIP_H, boost: 100 };
  const obstacles = [];
  const orbs = [];
  const particles = [];
  let score = 0;
  let keys = {};

  // Input handling
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const randRange = (min, max) => Math.random() * (max - min) + min;

  const spawnObjects = () => {
    if (Math.random() < SPAWN_RATE) {
      // obstacle
      const gap = 120; // hole for ship to pass
      const leftW = randRange(0, canvas.width - gap);
      obstacles.push({ x: 0, y: -OBSTACLE_H, w: leftW, h: OBSTACLE_H });
      obstacles.push({ x: leftW + gap, y: -OBSTACLE_H, w: canvas.width - leftW - gap, h: OBSTACLE_H });
    }
    if (Math.random() < SPAWN_RATE * 0.5) {
      // orb above the ship path
      const ox = randRange(20, canvas.width - 20);
      orbs.push({ x: ox, y: -ORB_R * 2, r: ORB_R });
    }
  };

  const update = () => {
    // Move ship based on input
    if (keys['ArrowLeft']) ship.x -= SHIP_SPEED;
    if (keys['ArrowRight']) ship.x += SHIP_SPEED;
    // Boost (space) with particle trail
    const boosting = keys[' '] && ship.boost > 0;
    if (boosting) {
      ship.y -= BOOST_SPEED;
      ship.boost -= BOOST_COST;
      // spawn particles behind ship
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: ship.x + ship.w / 2 + (Math.random() - 0.5) * ship.w,
          y: ship.y + ship.h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 1 + 0.5,
          life: 30,
          alpha: 0.8
        });
      }
      // boost sound
      playSound(300, 'square', 0.07);
    } else {
      ship.y += SHIP_SPEED; // normal forward motion
      ship.boost = Math.min(100, ship.boost + BOOST_REGEN);
    }
    // Keep ship in bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Move obstacles and orbs down (simulating forward travel)
    const speed = SHIP_SPEED;
    obstacles.forEach(o => (o.y += speed));
    orbs.forEach(o => (o.y += speed));
    // Update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.max(0, p.alpha - 0.02);
    });
    // Remove dead particles
    while (particles.length && particles[0].life <= 0) particles.shift();

    // Remove off‑screen objects
    while (obstacles.length && obstacles[0].y > canvas.height) obstacles.shift();
    while (orbs.length && orbs[0].y > canvas.height) orbs.shift();

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        // Game over sound
        playSound(150, 'sawtooth', 0.4);
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      const dx = ship.x + ship.w / 2 - orb.x;
      const dy = ship.y + ship.h / 2 - orb.y;
      if (dx * dx + dy * dy < (ship.w / 2 + orb.r) ** 2) {
        score += 10;
        orbs.splice(i, 1);
      }
    }
    score += 0.05; // slowly increase over time
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Nebula background with stars
    // Starfield (random small points)
    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const sr = Math.random() * 1.5 + 0.5;
      ctx.fillRect(sx, sy, sr, sr);
    }
    // Nebula gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#001020');
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // Draw ship as triangle (pointing up)
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y); // tip
    ctx.lineTo(ship.x, ship.y + ship.h); // left base
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h); // right base
    ctx.closePath();
    ctx.fill();

    // Draw obstacles with nebula texture (gradient)
    obstacles.forEach(o => {
      const gradObs = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      gradObs.addColorStop(0, '#442');
      gradObs.addColorStop(1, '#220');
      ctx.fillStyle = gradObs;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Draw orbs with glow effect
    orbs.forEach(o => {
      const gradient = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3);
      gradient.addColorStop(0, 'rgba(0,255,255,0.8)');
      gradient.addColorStop(0.5, 'rgba(0,255,255,0.3)');
      gradient.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 3, 0, Math.PI * 2);
      ctx.fill();
      // core
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw particles (boost trail)
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // UI: score & boost
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.fillText('Boost: ' + Math.floor(ship.boost), 10, 40);
  };

  const loop = () => {
    spawnObjects();
    update();
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
