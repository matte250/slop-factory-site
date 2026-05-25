// Neon Tunnel Runner – minimal canvas game
// Canvas with id="game" is assumed to exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container (or window)
  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const state = {
    stars: [],
    player: { x: 0, y: 0, w: 30, h: 30, speed: 5 },
    obstacles: [],
    orbs: [],
    energy: 100,
    score: 0,
    lastSpawn: 0,
    gameOver: false,
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };

    // Audio resume on first interaction
    let audioReady = false;
    const ensureAudio = () => {
      if (!audioReady && audioCtx.state === 'suspended') {
        audioCtx.resume();
        audioReady = true;
      }
    };
    // Input handling
    const keys = {};
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      ensureAudio();
    });
    window.addEventListener('keyup', e => (keys[e.key] = false));

  // Initialize player position (center horizontally, near bottom)
  const init = () => {
    state.player.x = canvas.width / 2 - state.player.w / 2;
    state.player.y = canvas.height - state.player.h - 10;
    // Initialize starfield
    const starCount = 100;
    state.stars = [];
    for (let i = 0; i < starCount; i++) {
      state.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 1.0,
      });
    }
  };
  init();

  // Utility – random integer [min, max)
  const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

  // Spawn obstacles and energy orbs
  const spawn = time => {
    if (time - state.lastSpawn < 800) return; // spawn every 800ms
    state.lastSpawn = time;
    // obstacle: vertical bar spanning part of width
    const width = rand(30, 80);
    const x = rand(0, canvas.width - width);
    state.obstacles.push({ x, y: -30, w: width, h: 30, speed: 2 });
    // 30% chance to spawn an orb
    if (Math.random() < 0.3) {
      const orbX = rand(0, canvas.width - 15);
      state.orbs.push({ x: orbX, y: -15, r: 8, speed: 2 });
    }
  };

  // Update game objects
  const update = dt => {
    if (state.gameOver) return;
    // Player movement
    if (keys.ArrowLeft) state.player.x -= state.player.speed;
    if (keys.ArrowRight) state.player.x += state.player.speed;
    // keep inside bounds
    state.player.x = Math.max(0, Math.min(canvas.width - state.player.w, state.player.x));

    // Move obstacles down (simulating forward motion)
    state.obstacles.forEach(o => (o.y += o.speed));
    state.obstacles = state.obstacles.filter(o => o.y < canvas.height);

    // Move orbs down
    state.orbs.forEach(o => (o.y += o.speed));
    state.orbs = state.orbs.filter(o => o.y < canvas.height);

    // Move stars down for parallax effect
    state.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
        s.speed = 0.5 + Math.random() * 1.0;
      }
    });
    // Collision detection
    const p = state.player;
    for (const o of state.obstacles) {
        if (
          p.x < o.x + o.w &&
          p.x + p.w > o.x &&
          p.y < o.y + o.h &&
          p.y + p.h > o.y
        ) {
          // Play collision sound
          playTone(150, 0.3);
          state.gameOver = true;
          break;
        }
    }
    for (let i = state.orbs.length - 1; i >= 0; i--) {
      const orb = state.orbs[i];
      const dx = p.x + p.w / 2 - (orb.x + orb.r);
      const dy = p.y + p.h / 2 - (orb.y + orb.r);
if (Math.hypot(dx, dy) < p.w / 2 + orb.r) {
          // Play orb collection sound
          playTone(400, 0.1);
          state.energy = Math.min(100, state.energy + 10);
          state.orbs.splice(i, 1);
          state.score += 10;
        }
    }

    // Energy drain
    state.energy -= dt * 0.02; // drain per ms
    if (state.energy <= 0) state.gameOver = true;
    state.score += dt * 0.01; // score over time
  };

  // Render
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background – dark gradient with moving starfield
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001020');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    state.stars && state.stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    // Player – neon rectangle with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
    ctx.shadowBlur = 0; // reset

    // Obstacles – neon spikes with gradient and glow
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 12;
    state.obstacles.forEach(o => {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#ff4444');
      obsGrad.addColorStop(1, '#aa0000');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.shadowBlur = 0;

    // Orbs – radial gradient glow
    state.orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.r, o.y + o.r, 0, o.x + o.r, o.y + o.r, o.r);
      grad.addColorStop(0, '#ffff80');
      grad.addColorStop(1, '#ff8000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.r, o.y + o.r, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Energy bar – neon outline
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, state.energy * 2, 10);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 10);
    ctx.lineWidth = 1;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(state.score), canvas.width - 120, 20);

    // Game over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  // Main loop
  let last = performance.now();
  const loop = now => {
    const dt = now - last;
    last = now;
    if (!state.gameOver) spawn(now);
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
