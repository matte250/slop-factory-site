// Simple Space Junk Collector game with enhanced graphics
// Adds starfield background, gradient fills, ship rotation, and subtle shadows
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');

  // Resize canvas to match displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const state = {
    ship: { x: 0, y: 0, size: 20, speed: 200, angle: 0 }, // pixels per second, angle in radians
    junk: [], // collectibles
    asteroids: [], // obstacles
    stars: [], // background starfield
    score: 0,
    timeLeft: 60, // seconds
    keys: {},
    lastTime: performance.now(),
    gameOver: false,
    gameOverPlayed: false,
  };

  // Initialise ship at centre
  const init = () => {
    state.ship.x = canvas.width / 2;
    state.ship.y = canvas.height / 2;
    // Populate starfield
    for (let i = 0; i < 100; i++) addStar();
    // Populate junk and asteroids
    for (let i = 0; i < 15; i++) addJunk();
    for (let i = 0; i < 5; i++) addAsteroid();
  };

  const randPos = (radius = 0) => ({
    x: Math.random() * (canvas.width - 2 * radius) + radius,
    y: Math.random() * (canvas.height - 2 * radius) + radius,
  });

  const addJunk = () => {
    const pos = randPos(5);
    state.junk.push({ x: pos.x, y: pos.y, r: 5 });
  };

  const addAsteroid = () => {
    const pos = randPos(15);
    const vx = (Math.random() - 0.5) * 80;
    const vy = (Math.random() - 0.5) * 80;
    state.asteroids.push({ x: pos.x, y: pos.y, r: 15, vx, vy });
  };

  // Add a background star
  const addStar = () => {
    const pos = randPos(1);
    const radius = Math.random() * 1.5 + 0.5;
    state.stars.push({ x: pos.x, y: pos.y, r: radius });
  };

  // Input handling (arrow keys / WASD)
  // Create AudioContext on first interaction to satisfy browsers' autoplay policy
  let audioCtx = null;
  const ensureAudioCtx = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  const beep = (freq, duration) => {
    ensureAudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };

  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      state.keys[e.key] = true;
      // Small tone to acknowledge input (optional)
      // beep(400, 0.05);
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      state.keys[e.key] = false;
      e.preventDefault();
    }
  });

  const update = dt => {
    if (state.gameOver) return;
    // Move ship
    const move = state.ship.speed * dt;
    let dx = 0, dy = 0;
    if (state.keys.ArrowUp || state.keys.w) { state.ship.y -= move; dy -= 1; }
    if (state.keys.ArrowDown || state.keys.s) { state.ship.y += move; dy += 1; }
    if (state.keys.ArrowLeft || state.keys.a) { state.ship.x -= move; dx -= 1; }
    if (state.keys.ArrowRight || state.keys.d) { state.ship.x += move; dx += 1; }
    // Update ship angle based on movement direction
    if (dx !== 0 || dy !== 0) {
      state.ship.angle = Math.atan2(dy, dx);
    }
    // Keep within bounds
    state.ship.x = Math.max(state.ship.size, Math.min(canvas.width - state.ship.size, state.ship.x));
    state.ship.y = Math.max(state.ship.size, Math.min(canvas.height - state.ship.size, state.ship.y));

    // Move asteroids
    state.asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // bounce off walls
      if (a.x < a.r || a.x > canvas.width - a.r) a.vx = -a.vx;
      if (a.y < a.r || a.y > canvas.height - a.r) a.vy = -a.vy;
    });

    // Check junk collection
    state.junk = state.junk.filter(j => {
      const dx = j.x - state.ship.x;
      const dy = j.y - state.ship.y;
      if (Math.hypot(dx, dy) < state.ship.size + j.r) {
        state.score++;
        // Play collect sound
        beep(800, 0.08);
        // spawn a new junk to keep count constant
        addJunk();
        return false; // remove collected
      }
      return true;
    });

    // Check collisions with asteroids
    for (const a of state.asteroids) {
      const dx = a.x - state.ship.x;
      const dy = a.y - state.ship.y;
      if (Math.hypot(dx, dy) < state.ship.size + a.r) {
        state.gameOver = true;
        // Play collision sound
        beep(200, 0.3);
        break;
      }
    }

    // Timer
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) state.gameOver = true;
  };

  const draw = () => {
    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Space background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Starfield background (soft white stars)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const star of state.stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with rotation and shadow
    ctx.save();
    ctx.translate(state.ship.x, state.ship.y);
    ctx.rotate(state.ship.angle);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'cyan';
    const s = state.ship.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s, s);
    ctx.lineTo(s, s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Junk with gradient fill
    const junkGrad = ctx.createRadialGradient(0,0,0,0,0,5);
    junkGrad.addColorStop(0,'#a8ff60');
    junkGrad.addColorStop(1,'#4caf50');
    ctx.fillStyle = junkGrad;
    for (const j of state.junk) {
      ctx.beginPath();
      ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Asteroids with shadow and gradient
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;
    const astGrad = ctx.createRadialGradient(0,0,0,0,0,15);
    astGrad.addColorStop(0,'#b0b0b0');
    astGrad.addColorStop(1,'#555');
    ctx.fillStyle = astGrad;
    for (const a of state.asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset shadow

    // UI – score and timer
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, Math.ceil(state.timeLeft))}`, 10, 40);

    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText(`Final Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  };

  const loop = now => {
    const dt = (now - state.lastTime) / 1000;
    state.lastTime = now;
    update(dt);
    draw();
    if (!state.gameOver) requestAnimationFrame(loop);
  };

  init();
  requestAnimationFrame(loop);
})();
