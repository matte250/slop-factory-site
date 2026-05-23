// Simple two‑player canvas game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Enable smoother shapes
  ctx.imageSmoothingEnabled = true;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume context on first interaction
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  const playSound = (freq, type = 'sine', dur = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  };

  // ----------- Game Settings -----------
  const PLAYER_SIZE = 20;
  const ASTEROID_SIZE = 30;
  const POWERUP_SIZE = 15;
  const BASE_PLAYER_SPEED = 2;
  const PLAYER_SPEED = BASE_PLAYER_SPEED; // may be boosted
  const ASTEROID_SPEED = 1;
  const POWERUP_DURATION = 3000; // ms
  const STAR_COUNT = 100; // background stars

  // ----------- Utility Functions -----------
  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const random = (min, max) => Math.random() * (max - min) + min;

  // Generate background stars
  const stars = [];
  const initStars = () => {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: random(0, width),
        y: random(0, height),
        r: random(0.5, 1.5),
      });
    }
  };
  initStars();

  // ----------- Entities -----------
    const players = [
      {
        // Player 1 starts left side, moves right
        x: PLAYER_SIZE,
        y: height / 2 - PLAYER_SIZE / 2,
        w: PLAYER_SIZE,
        h: PLAYER_SIZE,
        color: 'cyan',
        shield: false,
        alive: true,
        speedBoostExpires: 0,
        controls: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
      },
      {
        // Player 2 starts right side, moves left
        x: width - 2 * PLAYER_SIZE,
        y: height / 2 - PLAYER_SIZE / 2,
        w: PLAYER_SIZE,
        h: PLAYER_SIZE,
        color: 'magenta',
        shield: false,
        alive: true,
        speedBoostExpires: 0,
        controls: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
      },
    ];

  const asteroids = [];
  const powerUps = [];

  // ----------- Input Handling -----------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----------- Game Loop -----------
  let lastTime = 0;
  let gameOver = false;
  let winner = null;

  function spawnAsteroid() {
    const side = Math.floor(random(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const margin = 10;
    switch (side) {
      case 0:
        x = random(0, width);
        y = -margin;
        vx = random(-0.5, 0.5);
        vy = ASTEROID_SPEED;
        break;
      case 1:
        x = width + margin;
        y = random(0, height);
        vx = -ASTEROID_SPEED;
        vy = random(-0.5, 0.5);
        break;
      case 2:
        x = random(0, width);
        y = height + margin;
        vx = random(-0.5, 0.5);
        vy = -ASTEROID_SPEED;
        break;
      case 3:
        x = -margin;
        y = random(0, height);
        vx = ASTEROID_SPEED;
        vy = random(-0.5, 0.5);
        break;
    }
    // Add rotation properties
    const angle = random(0, Math.PI * 2);
    const angularV = random(-0.02, 0.02);
    asteroids.push({ x, y, w: ASTEROID_SIZE, h: ASTEROID_SIZE, vx, vy, angle, angularV });
  }

  function spawnPowerUp() {
    const type = Math.random() < 0.5 ? 'shield' : 'speed';
    powerUps.push({
      x: random(POWERUP_SIZE, width - POWERUP_SIZE),
      y: random(POWERUP_SIZE, height - POWERUP_SIZE),
      w: POWERUP_SIZE,
      h: POWERUP_SIZE,
      type,
    });
  }

  // Periodic spawns
  setInterval(spawnAsteroid, 1500);
  setInterval(spawnPowerUp, 8000);

  function update(dt) {
    if (gameOver) return;
    // Update players
    players.forEach(p => {
      if (!p.alive) return;
      const { up, down, left, right } = p.controls;
      // Determine current speed (boosted?)
      const speed = (Date.now() < p.speedBoostExpires) ? PLAYER_SPEED * 1.5 : PLAYER_SPEED;
      if (keys[up]) p.y -= speed;
      if (keys[down]) p.y += speed;
      if (keys[left]) p.x -= speed;
      if (keys[right]) p.x += speed;
      // Keep inside canvas
      p.x = Math.max(0, Math.min(width - p.w, p.x));
      p.y = Math.max(0, Math.min(height - p.h, p.y));
    });

    // Update asteroids (position & rotation)
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (typeof a.angle !== 'undefined') a.angle += a.angularV;
    });
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -ASTEROID_SIZE || a.x > width + ASTEROID_SIZE || a.y < -ASTEROID_SIZE || a.y > height + ASTEROID_SIZE) {
        asteroids.splice(i, 1);
      }
    }
    // Slight twinkle for stars
    stars.forEach(s => {
      s.r += random(-0.05, 0.05);
      if (s.r < 0.5) s.r = 0.5;
      if (s.r > 2) s.r = 2;
    });

    // Collision detection
    players.forEach(p => {
      if (!p.alive) return;
      // Asteroid collisions
        for (const a of asteroids) {
          if (rectsOverlap(p, a)) {
            if (p.shield) {
              p.shield = false; // shield consumed
              // Play shield break sound
              playSound(200, 'triangle', 0.2);
            } else {
              p.alive = false;
              // Play collision explode sound
              playSound(100, 'sawtooth', 0.3);
            }
            break;
          }
        }
      // Power‑up collisions
for (let i = powerUps.length - 1; i >= 0; i--) {
          const pu = powerUps[i];
          if (rectsOverlap(p, pu)) {
            if (pu.type === 'shield') {
              p.shield = true;
              // Shield pickup sound
              playSound(400, 'sine', 0.15);
            } else if (pu.type === 'speed') {
              p.speedBoostExpires = Date.now() + POWERUP_DURATION;
              // Speed boost sound
              playSound(600, 'square', 0.2);
            }
            powerUps.splice(i, 1);
          }
        }
    });

    // Check win / draw conditions
    const alivePlayers = players.filter(p => p.alive);
    if (alivePlayers.length === 0) {
      gameOver = true;
      winner = 'draw';
    } else {
      // Player 1 reaches right edge, player 2 reaches left edge
      if (players[0].x + players[0].w >= width) { gameOver = true; winner = 'Player 1'; playSound(800, 'sine', 0.5); }
      if (players[1].x <= 0) { gameOver = true; winner = 'Player 2'; }
    }
  }

  function draw() {
    // Fill background with dark space and stars
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw players as triangular ships with optional boost aura
    players.forEach(p => {
      if (!p.alive) return;
      // Speed boost aura
      if (Date.now() < p.speedBoostExpires) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,255,255,0.3)';
        const auraRadius = Math.max(p.w, p.h) * 1.5;
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      // point forward based on side (player 1 faces right, player 2 left)
      const facingRight = p.x < width / 2;
      if (facingRight) {
        ctx.moveTo(p.x, p.y + p.h / 2);
        ctx.lineTo(p.x + p.w, p.y);
        ctx.lineTo(p.x + p.w, p.y + p.h);
      } else {
        ctx.moveTo(p.x + p.w, p.y + p.h / 2);
        ctx.lineTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.h);
      }
      ctx.closePath();
      ctx.fill();
      if (p.shield) {
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const radius = Math.max(p.w, p.h);
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw asteroids as rotating circles with gradient
    asteroids.forEach(a => {
      ctx.save();
      // Move to asteroid center for rotation
      const cx = a.x + a.w / 2;
      const cy = a.y + a.h / 2;
      ctx.translate(cx, cy);
      if (typeof a.angle !== 'undefined') ctx.rotate(a.angle);
      // Gradient centered at origin after translation
      const grad = ctx.createRadialGradient(0, 0, a.w / 4, 0, 0, a.w / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw power‑ups as distinct symbols
    powerUps.forEach(pu => {
      if (pu.type === 'shield') {
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pu.x + pu.w / 2, pu.y + pu.h / 2, pu.w / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (pu.type === 'speed') {
        ctx.fillStyle = 'orange';
        ctx.font = `${pu.w}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', pu.x + pu.w / 2, pu.y + pu.h / 2);
      }
    });

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      const text = winner === 'draw' ? 'Draw!' : `${winner} Wins!`;
      const metrics = ctx.measureText(text);
      ctx.fillText(text, (width - metrics.width) / 2, height / 2);
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
