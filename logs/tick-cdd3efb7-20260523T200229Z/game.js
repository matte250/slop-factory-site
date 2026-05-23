// Simple canvas game based on IDEA.md – Cosmic Collector
// Assumes an existing <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Fit canvas to window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game state
  // Audio assets
  const sounds = {
    // Simple collect sound (short beep)
    collect: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='),
    // Simple hit sound (lower tone)
    hit: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='),
    // Background loop (silent placeholder)
    music: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=')
  };
  sounds.music.loop = true;
  sounds.music.volume = 0.2;
  // Initialize volumes according to mute state
  updateVolumes();
  // Start music on first user interaction to satisfy autoplay policies
  const startMusic = () => {
    sounds.music.play();
    window.removeEventListener('click', startMusic);
    window.removeEventListener('keydown', startMusic);
  };
  window.addEventListener('click', startMusic);
  window.addEventListener('keydown', startMusic);

  const state = {
    score: 0,
    shields: 3,
    objects: [], // falling debris
    particles: [], // sparkle particles on collection
    lastSpawn: 0,
    spawnInterval: 800, // ms
    player: { x: canvas.width / 2, y: canvas.height - 60, w: 40, h: 40 },
    keys: { left: false, right: false },
    mouseX: null,
    gameOver: false,
    muted: false,
  };

  // Helper to update volumes based on mute state
  const updateVolumes = () => {
    const vol = state.muted ? 0 : 0.5;
    sounds.collect.volume = vol;
    sounds.hit.volume = vol;
    sounds.music.volume = state.muted ? 0 : 0.2;
  };

  // Mute toggle (M key)
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'm') {
      state.muted = !state.muted;
      updateVolumes();
    }
  });

  // Enhanced background with gradient and twinkling stars
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2,
  }));

  const drawStars = () => {
    // Gradient background for depth
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Twinkling stars with slight flicker
    stars.forEach(s => {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.globalAlpha = 1;
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
    });
  };

  // Input handling – mouse moves ship horizontally, arrow keys as fallback
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') state.keys.left = true;
    if (e.key === 'ArrowRight') state.keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') state.keys.left = false;
    if (e.key === 'ArrowRight') state.keys.right = false;
  });

  // Object types – gold, fuel, tool (point values), asteroid (hazard)
  const TYPES = [
    { type: 'gold', color: 'gold', points: 10 },
    { type: 'fuel', color: 'lime', points: 5 },
    { type: 'tool', color: 'cyan', points: 8 },
    { type: 'asteroid', color: 'red', points: 0, hazard: true },
  ];

  const spawnObject = () => {
    const t = TYPES[Math.floor(Math.random() * TYPES.length)];
    const size = t.hazard ? 30 : 20;
    state.objects.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
      ...t,
    });
  };

  const update = delta => {
    if (state.gameOver) return;
    // player movement
    if (state.mouseX !== null) {
      state.player.x = state.mouseX - state.player.w / 2;
    } else {
      if (state.keys.left) state.player.x -= 5;
      if (state.keys.right) state.player.x += 5;
    }
    // keep within bounds
    state.player.x = Math.max(0, Math.min(state.player.x, canvas.width - state.player.w));

    // spawn objects
    const now = Date.now();
    if (now - state.lastSpawn > state.spawnInterval) {
      spawnObject();
      state.lastSpawn = now;
    }

    // update objects and check collisions
    state.objects = state.objects.filter(o => {
      o.y += o.speed;
      // collision detection
      const collides =
        o.x < state.player.x + state.player.w &&
        o.x + o.w > state.player.x &&
        o.y < state.player.y + state.player.h &&
        o.y + o.h > state.player.y;
      if (collides) {
if (o.hazard) {
            // hit asteroid
            sounds.hit.play();
            state.shields -= 1;
            if (state.shields <= 0) state.gameOver = true;
          } else {
            // collect item
            sounds.collect.play();
            state.score += o.points;
            // generate sparkle particles on collection
            for (let i = 0; i < 8; i++) {
              const angle = Math.random() * 2 * Math.PI;
              const speed = 1 + Math.random() * 2;
              state.particles.push({
                x: o.x + o.w / 2,
                y: o.y + o.h / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                maxLife: 30,
              });
            }
          }
        return false; // remove collided object
      }
      // keep onscreen
      return o.y < canvas.height;
    });

    // update particles
    state.particles = state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  };


  const draw = () => {
    drawStars();
    // draw player ship – gradient triangle with glow
    const p = state.player;
    const shipGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, p.y);
    ctx.lineTo(p.x, p.y + p.h);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.closePath();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // draw falling objects with enhanced graphics
    state.objects.forEach(o => {
      if (o.hazard) {
        // asteroid: irregular polygon with rotation
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const radius = o.w / 2;
        const sides = 6 + Math.floor(Math.random() * 3);
        const angle = (Date.now() / 500) % (2 * Math.PI);
        ctx.fillStyle = '#555';
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const theta = ((i / sides) * 2 * Math.PI) + angle;
          const rx = radius * (0.7 + Math.random() * 0.3);
          const x = cx + rx * Math.cos(theta);
          const y = cy + rx * Math.sin(theta);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.shadowColor = '#a33';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // collectible: radial gradient circle
        const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, 0, o.x + o.w/2, o.y + o.h/2, o.w/2);
        if (o.type === 'gold') {
          grad.addColorStop(0, '#ff0');
          grad.addColorStop(1, '#b8860b');
        } else if (o.type === 'fuel') {
          grad.addColorStop(0, '#0f0');
          grad.addColorStop(1, '#060');
        } else if (o.type === 'tool') {
          grad.addColorStop(0, '#0ff');
          grad.addColorStop(1, '#006');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
        ctx.fill();
      }
    });

    // draw particles (sparkles)
    state.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI*2);
      ctx.fill();
    });

    // UI: score & shields
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 30);
    // draw shield icons
    const shieldSize = 15;
    for (let i = 0; i < state.shields; i++) {
      const x = 10 + i * (shieldSize + 5);
      const y = 55;
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + shieldSize/2);
      ctx.quadraticCurveTo(x + shieldSize/2, y, x + shieldSize, y + shieldSize/2);
      ctx.quadraticCurveTo(x + shieldSize/2, y + shieldSize, x, y + shieldSize/2);
      ctx.closePath();
      ctx.stroke();
    }
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let lastTime = 0;
  const loop = timestamp => {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!state.gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
