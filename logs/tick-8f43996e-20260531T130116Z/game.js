// Simple Canvas Escape game based on IDEA.md
// Canvas element with id="game" expected in HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const player = { x: 20, y: 20, size: 20, speed: 2 };
  const barriers = [];
  const tokens = [];
  let lastTokenTime = 0;
  let score = 0;
  let gameOver = false;
  const keys = {};

  // Utility
  const rectIntersect = (a, b) =>
    a.x < b.x + b.size && a.x + a.size > b.x &&
    a.y < b.y + b.size && a.y + a.size > b.y;

  // Input handling
  // Initialize AudioContext for sound effects
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioStarted = false;
  const ensureAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playTokenSound = () => playTone(800, 0.15);
  const playCollisionSound = () => playTone(200, 0.3);

  // Input handling
  window.addEventListener('keydown', e => { keys[e.key] = true; ensureAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Create moving barriers (simple back‑and‑forth)
  const createBarriers = () => {
    for (let i = 0; i < 5; i++) {
      const horiz = i % 2 === 0; // alternating orientation
      const barrier = {
        x: horiz ? Math.random() * (width - 100) : Math.random() * width,
        y: horiz ? Math.random() * height : Math.random() * (height - 100),
        w: horiz ? 100 : 20,
        h: horiz ? 20 : 100,
        dx: horiz ? (Math.random() > 0.5 ? 1 : -1) * 1 : 0,
        dy: horiz ? 0 : (Math.random() > 0.5 ? 1 : -1) * 1,
        size: 0 // unused; keep API same as player/token
      };
      barriers.push(barrier);
    }
  };

  // Spawn a token at a random location
  const spawnToken = () => {
    const token = {
      x: Math.random() * (width - 20),
      y: Math.random() * (height - 20),
      size: 20,
      glow: Math.random() * 0.5 + 0.5 // for visual effect
    };
    tokens.push(token);
  };

  // Update loop
  const update = dt => {
    if (gameOver) return;
    // Move player
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Clamp
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // Move barriers
    barriers.forEach(b => {
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < 0 || b.x + b.w > width) b.dx *= -1;
      if (b.y < 0 || b.y + b.h > height) b.dy *= -1;
    });

    // Collision detection player vs barriers
    for (const b of barriers) {
      const rect = { x: b.x, y: b.y, size: 0, w: b.w, h: b.h };
      // simple AABB check
      if (
        player.x < b.x + b.w && player.x + player.size > b.x &&
        player.y < b.y + b.h && player.y + player.size > b.y
      ) {
        playCollisionSound();
          gameOver = true;
      }
    }

    // Token collection
    for (let i = tokens.length - 1; i >= 0; i--) {
if (rectIntersect(player, tokens[i])) {
          tokens.splice(i, 1);
          score++;
          playTokenSound();
        }
    }

    // Spawn token every 3 seconds
    if (Date.now() - lastTokenTime > 3000) {
      spawnToken();
      lastTokenTime = Date.now();
    }
  };

  // Render loop with enhanced graphics
  // Helper to draw rounded rectangle
  const drawRoundedRect = (x, y, w, h, radius, fillStyle) => {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Helper to draw glowing token
  const drawToken = (token) => {
    const grad = ctx.createRadialGradient(
      token.x + token.size / 2,
      token.y + token.size / 2,
      token.size * 0.2,
      token.x + token.size / 2,
      token.y + token.size / 2,
      token.size / 2
    );
    grad.addColorStop(0, `rgba(255,215,0,${Math.min(token.glow + 0.3, 1)})`);
    grad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(token.x + token.size / 2, token.y + token.size / 2, token.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const render = () => {
    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    // Player with gradient rounded rect
    const playerGrad = ctx.createLinearGradient(0, 0, player.size, player.size);
    playerGrad.addColorStop(0, '#4a90e2');
    playerGrad.addColorStop(1, '#007aff');
    drawRoundedRect(player.x, player.y, player.size, player.size, 4, playerGrad);
    // Barriers with red gradient
    const barrierGrad = ctx.createLinearGradient(0, 0, 0, 20);
    barrierGrad.addColorStop(0, '#ff4d4d');
    barrierGrad.addColorStop(1, '#b20000');
    barriers.forEach(b => drawRoundedRect(b.x, b.y, b.w, b.h, 3, barrierGrad));
    // Tokens
    tokens.forEach(t => drawToken(t));
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };
  const render = () => {
    ctx.clearRect(0, 0, width, height);
    // Player
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // Barriers
    ctx.fillStyle = '#f00';
    barriers.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    // Tokens
    tokens.forEach(t => {
      ctx.fillStyle = `rgba(255,215,0,${t.glow})`;
      ctx.fillRect(t.x, t.y, t.size, t.size);
    });
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  // Main loop using requestAnimationFrame
  let last = performance.now();
  const loop = now => {
    const dt = now - last;
    last = now;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  };

  createBarriers();
  requestAnimationFrame(loop);
})();
