// Simple "Pixel Escape" canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  const PLAYER_SIZE = 20;
  const BASE_SPEED = 2;
  const BOOST_SPEED = 5;
  const BOOST_TIME = 2000; // ms

  const state = {
    player: { x: 50, y: H / 2 - PLAYER_SIZE / 2, vy: 0 },
    obstacles: [],
    orbs: [],
    speed: BASE_SPEED,
    boostTimer: 0,
    score: 0,
    gameOver: false,
    particles: [], // visual boost particles
    // Sound effects (embedded as data URIs)
    boostSound: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='),
    crashSound: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=')
  };

  // Input – up/down arrows or space to jump up, release to fall down
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnObstacle() {
    const gapHeight = 120 + Math.random() * 80; // vertical gap
    const gapY = Math.random() * (H - gapHeight);
    const width = 30 + Math.random() * 20;
    state.obstacles.push({ x: W, width, gapY, gapHeight });
  }

  function spawnOrb() {
    const radius = 8;
    const x = W + Math.random() * 200;
    const y = Math.random() * (H - radius * 2) + radius;
    state.orbs.push({ x, y, radius, collected: false });
  }

  // Initial spawns
  let obstacleTimer = 0;
  let orbTimer = 0;

  function update(dt) {
    if (state.gameOver) return;

    // Update particle positions (simple drift)
    state.particles.forEach(p => {
      p.x += p.vx * dt * 0.01;
      p.y += p.vy * dt * 0.01;
      p.life -= dt;
    });
    // Remove dead particles
    state.particles = state.particles.filter(p => p.life > 0 && p.x > 0 && p.x < W && p.y > 0 && p.y < H);

    // Player vertical movement
    if (keys['ArrowUp'] || keys['Space']) {
      state.player.vy = -4;
    } else if (keys['ArrowDown']) {
      state.player.vy = 4;
    } else {
      state.player.vy *= 0.9; // dampen
    }
    state.player.y += state.player.vy;
    // Clamp
    if (state.player.y < 0) state.player.y = 0;
    if (state.player.y + PLAYER_SIZE > H) state.player.y = H - PLAYER_SIZE;

    // Move obstacles & orbs
    state.obstacles.forEach(o => o.x -= state.speed);
    state.orbs.forEach(o => o.x -= state.speed);

    // Remove off‑screen
    state.obstacles = state.obstacles.filter(o => o.x + o.width > 0);
    state.orbs = state.orbs.filter(o => o.x + o.radius > 0 && !o.collected);

    // Spawn logic
    obstacleTimer += dt;
    if (obstacleTimer > 1500) { // every 1.5s
      spawnObstacle();
      obstacleTimer = 0;
    }
    orbTimer += dt;
    if (orbTimer > 4000) {
      spawnOrb();
      orbTimer = 0;
    }

    // Collision detection – obstacles
    for (const o of state.obstacles) {
      const px = state.player.x;
      const py = state.player.y;
if (
          px + PLAYER_SIZE > o.x &&
          px < o.x + o.width &&
          (py < o.gapY || py + PLAYER_SIZE > o.gapY + o.gapHeight)
        ) {
          state.gameOver = true;
          // Play crash sound
          state.crashSound.currentTime = 0;
          state.crashSound.play();
          break;
        }
    }

    // Orbs
    for (const orb of state.orbs) {
      const dx = (state.player.x + PLAYER_SIZE / 2) - orb.x;
      const dy = (state.player.y + PLAYER_SIZE / 2) - orb.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < (PLAYER_SIZE / 2 + orb.radius) ** 2) {
        orb.collected = true;
        state.speed = BOOST_SPEED;
        state.boostTimer = BOOST_TIME;
        // Play boost sound
        state.boostSound.currentTime = 0;
        state.boostSound.play();
        // Spawn particles on boost start
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2;
          state.particles.push({
            x: state.player.x + PLAYER_SIZE / 2,
            y: state.player.y + PLAYER_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 2,
            life: 500 + Math.random() * 300,
          });
        }
      }
    }

    // Boost timer – continue emitting particles while boosting
    if (state.boostTimer > 0) {
      state.boostTimer -= dt;
      // Emit a few particles each frame for trail effect
      for (let i = 0; i < 4; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * 0.4; // behind player
        const speed = 1 + Math.random() * 1.5;
        state.particles.push({
          x: state.player.x + PLAYER_SIZE / 2,
          y: state.player.y + PLAYER_SIZE / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1 + Math.random() * 1.5,
          life: 300 + Math.random() * 200,
        });
      }
      if (state.boostTimer <= 0) state.speed = BASE_SPEED;
    }

    state.score += state.speed * dt * 0.01;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Particle trail (if boosting)
    if (state.particles) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      state.particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Player with rounded corners and gradient
    const playerGrad = ctx.createLinearGradient(state.player.x, state.player.y, state.player.x + PLAYER_SIZE, state.player.y + PLAYER_SIZE);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#09f');
    ctx.fillStyle = playerGrad;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(state.player.x + radius, state.player.y);
    ctx.lineTo(state.player.x + PLAYER_SIZE - radius, state.player.y);
    ctx.quadraticCurveTo(state.player.x + PLAYER_SIZE, state.player.y, state.player.x + PLAYER_SIZE, state.player.y + radius);
    ctx.lineTo(state.player.x + PLAYER_SIZE, state.player.y + PLAYER_SIZE - radius);
    ctx.quadraticCurveTo(state.player.x + PLAYER_SIZE, state.player.y + PLAYER_SIZE, state.player.x + PLAYER_SIZE - radius, state.player.y + PLAYER_SIZE);
    ctx.lineTo(state.player.x + radius, state.player.y + PLAYER_SIZE);
    ctx.quadraticCurveTo(state.player.x, state.player.y + PLAYER_SIZE, state.player.x, state.player.y + PLAYER_SIZE - radius);
    ctx.lineTo(state.player.x, state.player.y + radius);
    ctx.quadraticCurveTo(state.player.x, state.player.y, state.player.x + radius, state.player.y);
    ctx.closePath();
    ctx.fill();

    // Obstacles with dark red gradient
    const obsGrad = ctx.createLinearGradient(0, 0, 0, H);
    obsGrad.addColorStop(0, '#600');
    obsGrad.addColorStop(1, '#b00');
    ctx.fillStyle = obsGrad;
    for (const o of state.obstacles) {
      ctx.fillRect(o.x, 0, o.width, o.gapY);
      ctx.fillRect(o.x, o.gapY + o.gapHeight, o.width, H - o.gapY - o.gapHeight);
    }

    // Orbs with glowing radial gradient
    for (const orb of state.orbs) {
      const grad = ctx.createRadialGradient(orb.x, orb.y, orb.radius * 0.2, orb.x, orb.y, orb.radius);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#880');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(state.score), 10, 20);

    // Game over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!state.gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
