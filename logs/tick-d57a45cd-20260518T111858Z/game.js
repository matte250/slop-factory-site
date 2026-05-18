// Asteroid Miner – concise canvas game
// Target canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  // ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ---- Game state -----------------------------------------------------
  const ship = {
  // ship properties

    x: 100,
    y: H / 2,
    angle: 0, // radians, 0 pointing right
    vx: 0,
    vy: 0,
    radius: 15,
    thrust: 0.2,
    turnSpeed: 0.07,
    fuel: 100,
  };

  const asteroids = [];
  // starfield
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H });
  }

  // explosion particles
  const particles = [];
  const keys = {};
  let score = 0;
  let laser = false;
  let gameOver = false;

  // ---- Input ----------------------------------------------------------
  window.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'ArrowUp') playTone(200, 0.05); if (e.code === 'Space') playTone(800, 0.1); });
  window.addEventListener('keyup', e => keys[e.code] = false);

  // ---- Helpers --------------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---- Game loop ------------------------------------------------------
  function update(dt) {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp'] && ship.fuel > 0) {
       ship.vx += Math.cos(ship.angle) * ship.thrust;
       ship.vy += Math.sin(ship.angle) * ship.thrust;
       ship.fuel -= 0.05; // consume fuel per thrust frame
       // thrust particles
       for (let i = 0; i < 2; i++) {
         particles.push({
           x: ship.x - Math.cos(ship.angle) * 12,
           y: ship.y - Math.sin(ship.angle) * 12,
           vx: (Math.random() - 0.5) * 0.5,
           vy: (Math.random() - 0.5) * 0.5,
           radius: rand(0.5, 1.5),
           life: rand(10, 20) | 0,
           maxLife: rand(10, 20) | 0,
         });
       }
     }
    laser = !!keys['Space'];

    // Apply inertia (simple drag)
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Keep ship inside canvas (wrap horizontally, bounce vertically)
    if (ship.x > W) ship.x = 0;
    if (ship.x < 0) ship.x = W;
    if (ship.y > H) ship.y = H;
    if (ship.y < 0) ship.y = 0;

    // Generate asteroids with rotation
    if (Math.random() < 0.02) {
      const size = rand(10, 30);
      asteroids.push({
        x: W + size,
        y: rand(0, H),
        radius: size,
        speed: rand(1, 3),
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    // Update asteroids (position & rotation)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      a.angle += a.rotSpeed;
      // Remove when off‑screen
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }

    // Collision & mining
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const d = dist(ship, a);
      // Collision – end game
      if (d < ship.radius + a.radius) {
        gameOver = true;
        break;
      }
        // Mining laser – destroy asteroid
        if (laser && d < ship.radius + a.radius + 20) {
          score += Math.floor(a.radius);
          ship.fuel = Math.min(100, ship.fuel + a.radius * 0.2);
          // laser sound
          playTone(1000, 0.08);
          // create explosion particles
          for (let p = 0; p < 12; p++) {
            particles.push({
              x: a.x,
              y: a.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              radius: rand(1, 3),
              life: rand(20, 40) | 0,
            });
          }
          // remove asteroid
          asteroids.splice(i, 1);
        }

        // remove asteroid
        asteroids.splice(i, 1);
      }
    }
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Fuel depletion win/lose
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // background – starfield with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // ship – gradient hull and thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // hull gradient
    const hullGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    hullGrad.addColorStop(0, '#0a0');
    hullGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    // thrust flame when accelerating
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.fillStyle = 'rgba(255,160,0,0.8)';
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // asteroids – radial gradient shading with rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // particles – fading with life‑based opacity
    particles.forEach(p => {
      const alpha = Math.max(p.life / p.maxLife, 0);
      ctx.fillStyle = `rgba(255,200,50,${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // laser visual
    if (laser) {
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      const lx = ship.x + Math.cos(ship.angle) * 40;
      const ly = ship.y + Math.sin(ship.angle) * 40;
      ctx.lineTo(lx, ly);
      ctx.stroke();
    }

    // UI – score, fuel
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(1)}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
