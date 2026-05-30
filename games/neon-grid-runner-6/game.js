// Minimal Neon Grid Runner based on IDEA.md
// Canvas with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set full‑screen size
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const state = {
    player: { x: 0, y: 0, radius: 12, vy: 0, onGround: true },
    speed: 2, // grid scroll speed (pixels per frame)
    offset: 0, // vertical scroll offset
    obstacles: [], // {x, y, w, h}
    score: 0,
    running: true,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  // Initialize player position
  const init = () => {
    state.player.x = canvas.width / 2;
    state.player.y = canvas.height - state.player.radius - 10;
  };
  init();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const startAudio = () => {
    if (audioStarted) return;
    // resume context on user interaction
    audioCtx.resume();
    audioStarted = true;
    // background humming
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(30, audioCtx.currentTime); // low hum
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    // stop when game over
    state.stopBackground = () => {
      oscillator.stop();
    };
  };

  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Hook start audio on first key press
  window.addEventListener('keydown', () => startAudio(), { once: true });

  // Utility: generate obstacle at random x on next grid row
  const maybeAddObstacle = () => {
    // Add obstacle every 120 frames (~2 seconds at 60fps)
    if (Math.random() < 0.02) {
      const colCount = Math.floor(canvas.width / 40);
      const col = Math.floor(Math.random() * colCount);
      const x = col * 40 + 20;
      const y = -state.offset - 20; // just above visible area
      state.obstacles.push({ x, y, w: 20, h: 20 });
    }
  };

  // Collision detection (circle vs rect)
  const circleRectCollide = (cx, cy, r, rect) => {
    const distX = Math.abs(cx - rect.x - rect.w / 2);
    const distY = Math.abs(cy - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + r) return false;
    if (distY > rect.h / 2 + r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= r * r;
  };

  // Main loop
  const loop = () => {
    if (!state.running) return;
    // Update offset
    state.offset += state.speed;
    state.score = Math.floor(state.offset / 10);

    // Player movement
    const p = state.player;
    const step = 5;
    if (keys['ArrowLeft']) p.x -= step;
    if (keys['ArrowRight']) p.x += step;
    // Keep within bounds
    p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
    // Jump
    if (keys['ArrowUp'] || keys[' ']) {
      if (p.onGround) {
        p.vy = -12;
        p.onGround = false;
        // Play jump sound
        playTone(500, 0.08);
      }
    }
    // Gravity
    p.vy += 0.5;
    p.y += p.vy;
    // Ground check
    const groundY = canvas.height - p.radius - 10;
    if (p.y >= groundY) {
      p.y = groundY;
      p.vy = 0;
      p.onGround = true;
    }

    // Add obstacles
    maybeAddObstacle();
    // Move obstacles down (relative to scroll)
    state.obstacles.forEach(o => (o.y += state.speed));
    // Remove off‑screen obstacles
    state.obstacles = state.obstacles.filter(o => o.y < canvas.height + 20);

    // Collision check
    for (const o of state.obstacles) {
      if (circleRectCollide(p.x, p.y, p.radius, o)) {
        // Play collision sound
        playTone(200, 0.3);
        state.running = false;
        // Stop background hum
        if (state.stopBackground) state.stopBackground();
        break;
      }
    }

    // Rendering
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Neon grid background (vertical lines with glow)
    ctx.strokeStyle = 'rgba(0,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0,255,255,0.5)';
    ctx.shadowBlur = 8;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset blur for other drawing
    // Draw obstacles as spikes (triangles)
    ctx.fillStyle = '#ff0';
    state.obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - o.h / 2);
      ctx.lineTo(o.x - o.w / 2, o.y + o.h / 2);
      ctx.lineTo(o.x + o.w / 2, o.y + o.h / 2);
      ctx.closePath();
      ctx.fill();
    });
    // Particle trail for player
    state.particles = state.particles || [];
    state.particles.push({x:p.x, y:p.y, life:30});
    state.particles.forEach(pt => {
      const alpha = pt.life / 30;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, p.radius, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0,255,255,${alpha * 0.6})`;
      ctx.fill();
    });
    // Remove old particles
    state.particles = state.particles.filter(pt => pt.life-- > 0);
    // Player orb with glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + state.score, 20, 30);

    if (state.running) {
      requestAnimationFrame(loop);
    } else {
      // Game Over overlay with neon effect
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Score: ' + state.score, canvas.width / 2, canvas.height / 2 + 50);
    }
  };

  requestAnimationFrame(loop);
})();
