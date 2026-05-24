// Neon Dash – minimal endless runner
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 400;
  const HEIGHT = canvas.height = canvas.offsetHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioReady = false;
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Particle system for glow effects
  const particles = [];
  const MAX_PARTICLES = 100;

  // Player (glowing square) with gradient
  const player = {
    w: 30,
    h: 30,
    x: WIDTH / 2 - 15,
    y: HEIGHT - 60,
    speed: 4,
    color: '#0ff', // cyan neon
    draw() {
      // radial gradient for neon core
      const grad = ctx.createRadialGradient(
        this.x + this.w / 2,
        this.y + this.h / 2,
        2,
        this.x + this.w / 2,
        this.y + this.h / 2,
        this.w / 2
      );
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.shadowBlur = 0;
    }
  };

  // Obstacle bars (horizontal)
  const obstacles = [];
  const OBSTACLE_HEIGHT = 20;
  const OBSTACLE_SPEED = 2;
  const OBSTACLE_INTERVAL = 1200; // ms
  let lastObstacleTime = 0;

  // Game state
  let running = true;
  let lastFrame = performance.now();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // unlock audio on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function randomNeonColor() {
    // hue 0-360, saturation 80-100%, lightness 50-70%
    const h = Math.floor(Math.random() * 360);
    const s = 80 + Math.random() * 20;
    const l = 50 + Math.random() * 20;
    return `hsl(${h},${s}%,${l}%)`;
  }

  function spawnObstacle() {
    const barWidth = Math.random() * (WIDTH * 0.6) + (WIDTH * 0.2);
    const x = Math.random() * (WIDTH - barWidth);
    const y = -OBSTACLE_HEIGHT;
    obstacles.push({ x, y, w: barWidth, h: OBSTACLE_HEIGHT, color: randomNeonColor() });
    // Play a short tone for obstacle spawn
    if (audioCtx.state === 'running') playTone(200, 0.08);
  }

  function update(dt) {
    // Move player left/right
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Constrain within canvas
    player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

    // Emit particles from player position
    if (particles.length < MAX_PARTICLES) {
      particles.push({
        x: player.x + player.w / 2,
        y: player.y + player.h / 2,
        r: Math.random() * 3 + 2,
        vy: -0.5 - Math.random() * 0.5,
        alpha: 0.8,
        color: player.color
      });
    }

    // Spawn obstacles
    if (performance.now() - lastObstacleTime > OBSTACLE_INTERVAL) {
      spawnObstacle();
      lastObstacleTime = performance.now();
    }

    // Move obstacles down (simulating upward motion)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += OBSTACLE_SPEED;
      // Remove off‑screen obstacles
      if (o.y > HEIGHT) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // Play collision sound
        if (audioCtx.state === 'running') playTone(100, 0.3);
        running = false;
        break;
      }
    }

    // Lose if player falls off bottom (should not happen in this design)
    if (player.y > HEIGHT) {
      if (audioCtx.state === 'running') playTone(80, 0.3);
      running = false;
    }
  }

  function draw() {
    // Gradient background (dark to deeper dark)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#050505');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Neon grid with glowing lines
    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 0.8;
    const gridSize = 40;
    for (let x = 0; x < WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // Particle trail (simple fading circles)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      // update particle
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Draw obstacles with gradient + glow
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, o.color);
      grad.addColorStop(1, 'rgba(255,0,255,0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.shadowBlur = 0;
    }

    // Draw player (glow handled in player.draw)
    player.draw();
  }

  function loop(timestamp) {
    const dt = timestamp - lastFrame;
    lastFrame = timestamp;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over screen
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  requestAnimationFrame(loop);
})();
