// Orbit Escape Game
// Assumes a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  let gameOverSoundPlayed = false;

  // Particle system for thrust flame
  const particles = [];
  function spawnParticle(x, y, angle) {
    const speed = Math.random() * 1 + 0.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
      life: 300 + Math.random() * 200,
      radius: Math.random() * 2 + 1,
    });
  }


  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    radius: 10,
    speedX: 0,
    speedY: 0,
    fuel: 100,
  };

  // Asteroids
  const asteroids = [];
  const ASTEROID_COUNT = 5;
  const ASTEROID_SPEED = 1.5;

  // Stars for background
  const stars = [];
  const STAR_COUNT = 80;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
      });
    }
  }

  // Generate irregular asteroid shape points
  function generateAsteroidPoints(a) {
    const points = [];
    const sides = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      const variance = 0.6 + Math.random() * 0.4;
      const r = a.r * variance;
      points.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r });
    }
    a.points = points;
  }

  // Game state
  let lastTime = 0;
  let alive = true;
  let survived = 0; // milliseconds

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function initAsteroids() {
    for (let i = 0; i < ASTEROID_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.min(width, height) / 2 + 50;
      const asteroid = {
        x: ship.x + Math.cos(angle) * distance,
        y: ship.y + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * ASTEROID_SPEED,
        vy: (Math.random() - 0.5) * ASTEROID_SPEED,
        r: 15 + Math.random() * 10,
      };
      generateAsteroidPoints(asteroid);
      asteroids.push(asteroid);
    }
  }

  function update(dt) {
    if (!alive) return;
    // Fuel drain
    ship.fuel -= dt * 0.01; // constant drain
    if (ship.fuel <= 0) {
      ship.fuel = 0;
      if (!gameOverSoundPlayed) {
        playTone(100, 300);
        gameOverSoundPlayed = true;
      }
      alive = false;
    }

    // Rotation
    if (keys['ArrowLeft']) ship.angle -= 0.003 * dt;
    if (keys['ArrowRight']) ship.angle += 0.003 * dt;

    // Thrust
    if (keys['Space'] && ship.fuel > 0) {
      const thrust = 0.05;
      ship.speedX += Math.cos(ship.angle) * thrust;
      ship.speedY += Math.sin(ship.angle) * thrust;
      ship.fuel -= dt * 0.05; // extra fuel for thrust
      // spawn thrust particles
      for (let i = 0; i < 2; i++) {
        spawnParticle(ship.x, ship.y, ship.angle + Math.PI);
      }
      // play thrust sound
      playTone(400, 80);
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Move ship
    ship.x += ship.speedX;
    ship.y += ship.speedY;
    // Simple friction
    ship.speedX *= 0.99;
    ship.speedY *= 0.99;
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
    if (dist < a.r + ship.radius) {
          if (!gameOverSoundPlayed) {
            playTone(150, 300);
            gameOverSoundPlayed = true;
          }
          alive = false;
          break;
        }
    }

    survived += dt;
  }

  function draw() {
    // Clear with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw ship with simple thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = alive ? '#fff' : '#f44';
    ctx.fill();
    // Thrust flame when accelerating
    if (keys['Space'] && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();

    // Draw thrust particles
    ctx.fillStyle = 'orange';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.globalAlpha = Math.max(p.life / 500, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw background stars
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    }

    // Draw asteroids with irregular shapes
    ctx.fillStyle = '#777';
    for (const a of asteroids) {
      ctx.beginPath();
      const pts = a.points;
      if (!pts) {
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      } else {
        ctx.moveTo(a.x + pts[0].x, a.y + pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(a.x + pts[i].x, a.y + pts[i].y);
        }
        ctx.closePath();
      }
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 20);
    ctx.fillText(`Time: ${(survived/1000).toFixed(1)}s`, 10, 35);
    if (!alive) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  initStars();
  initAsteroids();
  requestAnimationFrame(loop);
})();
