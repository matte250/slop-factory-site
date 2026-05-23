// Cosmic Catch – enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  const initStars = () => {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };
  initStars();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Ensure audio context resumes on user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });

  // Ship – fixed x, moves vertically
  const ship = {
    x: 50,
    y: HEIGHT / 2,
    radius: 12,
    speed: 4,
  };

  // Input state
  const keys = { ArrowUp: false, ArrowDown: false, Space: false };
  window.addEventListener('keydown', e => {
    if (e.code in keys) keys[e.code] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code in keys) keys[e.code] = false;
  });

  // Shield handling
  let shieldActive = false;
  let shieldTimer = 0; // frames left
  let shieldCooldown = 0; // frames left
  const SHIELD_DURATION = 60; // ~1s at 60fps
  const SHIELD_COOLDOWN = 600; // 10s

  // Game objects
  const orbs = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // Utility
  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnOrb = () => {
    const size = 8;
    orbs.push({
      x: WIDTH + size,
      y: rand(size, HEIGHT - size),
      r: size,
      speed: 2,
    });
  };

  const spawnAsteroid = () => {
    const size = rand(12, 24);
    asteroids.push({
      x: WIDTH + size,
      y: rand(size, HEIGHT - size),
      r: size,
      speed: 2 + score * 0.02, // gradually faster
    });
  };

  // Game loop
  const update = () => {
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, WIDTH / 2, HEIGHT / 2);
      return;
    }

    // Draw background (starfield)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'white';
    for (let s = 0; s < stars.length; s++) {
      const star = stars[s];
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    ship.y = Math.max(ship.radius, Math.min(HEIGHT - ship.radius, ship.y));
    // Update stars for parallax effect
    for (let s = 0; s < stars.length; s++) {
      const star = stars[s];
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = WIDTH;
        star.y = Math.random() * HEIGHT;
      }
    }

    // Shield activation
    if (keys.Space && !shieldActive && shieldCooldown === 0) {
      shieldActive = true;
      shieldTimer = SHIELD_DURATION;
      // Play shield activation sound
      playBeep(660, 0.2);
    }
    if (shieldActive) {
      shieldTimer--;
      if (shieldTimer <= 0) {
        shieldActive = false;
        shieldCooldown = SHIELD_COOLDOWN;
      }
    } else if (shieldCooldown > 0) {
      shieldCooldown--;
    }

    // Draw ship (triangle pointing right) with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const shipGrad = ctx.createLinearGradient(-ship.radius, -ship.radius, ship.radius, ship.radius);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(-ship.radius, -ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.lineTo(ship.radius, 0);
    ctx.closePath();
    ctx.fill();
    // ship outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Exhaust flame (simple gradient triangle behind ship)
    const flameGrad = ctx.createLinearGradient(-ship.radius*2, 0, -ship.radius, 0);
    flameGrad.addColorStop(0, 'rgba(255,160,0,0.8)');
    flameGrad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-ship.radius, -ship.radius/2);
    ctx.lineTo(-ship.radius*2, 0);
    ctx.lineTo(-ship.radius, ship.radius/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Shield visual
    if (shieldActive) {
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'gold';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x -= o.speed;
      // Draw orb with glowing gradient
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      orbGrad.addColorStop(0, '#aaffaa');
      orbGrad.addColorStop(1, '#006600');
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();
      // collision with ship
      const dx = o.x - ship.x;
      const dy = o.y - ship.y;
      if (dx * dx + dy * dy < (o.r + ship.radius) ** 2) {
        score++;
        // Play collection sound
        playBeep(440, 0.1);
        orbs.splice(i, 1);
      } else if (o.x + o.r < 0) {
        orbs.splice(i, 1);
      }
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Draw asteroid with rocky gradient
      const asteroidGrad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      asteroidGrad.addColorStop(0, '#777777');
      asteroidGrad.addColorStop(1, '#222222');
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = asteroidGrad;
      ctx.fill();
      // collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.r + ship.radius) ** 2) {
        if (shieldActive) {
          // deflect – remove asteroid
          asteroids.splice(i, 1);
          // Play deflection sound
          playBeep(300, 0.15);
        } else {
          // Play crash sound before game over
          playBeep(150, 0.3);
          gameOver = true;
        }
        continue;
      }
      if (a.x + a.r < 0) {
        asteroids.splice(i, 1);
      }
    }

    // Score & shield cooldown
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!shieldActive && shieldCooldown > 0) {
      ctx.fillText('Shield CD: ' + Math.ceil(shieldCooldown / 60) + 's', 10, 40);
    }

    // Spawn logic
    if (Math.random() < 0.02) spawnOrb(); // roughly every 50 frames
    if (Math.random() < 0.015) spawnAsteroid();

    requestAnimationFrame(update);
  };

  // Start loop
  requestAnimationFrame(update);
})();
