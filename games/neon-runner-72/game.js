// Simple Neon Runner implementation based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Particle array for trailing effect
  const particles = [];
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its parent or default 800x600
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const PLAYER_RADIUS = 10;
  const PLAYER_SPEED_X = 4; // horizontal speed per frame
  const PLAYER_Y = canvas.height - 40; // fixed vertical position

  const player = {
    x: canvas.width / 2,
    y: PLAYER_Y,
    radius: PLAYER_RADIUS,
    color: '#0ff', // neon cyan
  };

  const blocks = [];
  const BLOCK_WIDTH = 50;
  const BLOCK_HEIGHT = 20;
  const BLOCK_SPEED = 2; // downwards speed (simulates player moving up)
  const BLOCK_INTERVAL = 1500; // ms between new blocks

  let lastBlockTime = 0;
  let gameOver = false;
  let animationId = null;

  // Input handling – arrow keys or touch
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
  });
  // Simple touch controls: tap left/right half of canvas
  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < canvas.width / 2) keys.ArrowLeft = true;
    else keys.ArrowRight = true;
  });
  canvas.addEventListener('touchend', () => {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
  });
  // Resume audio context on first user interaction
  canvas.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });

  function spawnBlock() {
    const laneCount = Math.floor(canvas.width / BLOCK_WIDTH);
    const lane = Math.floor(Math.random() * laneCount);
    const x = lane * BLOCK_WIDTH;
    const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    blocks.push({ x, y: -BLOCK_HEIGHT, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, color });
    // Play a short tone when a block appears
    playTone(250 + Math.random() * 200, 0.08);
  }

  function update(delta) {
    // Move player horizontally based on input
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED_X;
    if (keys.ArrowRight) player.x += PLAYER_SPEED_X;
    // Clamp within canvas
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    // Add a particle at player's position for trailing effect
    particles.push({
      x: player.x,
      y: player.y,
      radius: 2,
      color: player.color,
      life: 0.5 // seconds
    });

    // Spawn blocks at interval
    if (performance.now() - lastBlockTime > BLOCK_INTERVAL) {
      spawnBlock();
      lastBlockTime = performance.now();
    }

    // Update block positions
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += BLOCK_SPEED;
      // Remove off‑screen blocks
      if (b.y > canvas.height) blocks.splice(i, 1);
    }

    // Collision detection (circle vs rect)
    for (const b of blocks) {
      const distX = Math.abs(player.x - (b.x + b.width / 2));
      const distY = Math.abs(player.y - (b.y + b.height / 2));
      if (distX > b.width / 2 + player.radius) continue;
      if (distY > b.height / 2 + player.radius) continue;
      if (distX <= b.width / 2 || distY <= b.height / 2) {
        gameOver = true;
        // Play crash sound
        playTone(100, 0.2);
        break;
      }
      const dx = distX - b.width / 2;
      const dy = distY - b.height / 2;
      if (dx * dx + dy * dy <= player.radius * player.radius) {
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Background gradient (dark to deep blue)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#02002e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles for trailing effect
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.016; // approximate seconds per frame
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life; // fade out
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw player with stronger neon glow
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw blocks with neon outline
    for (const b of blocks) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.restore();
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) {
      animationId = requestAnimationFrame(loop);
    }
  }

  // Start the loop
  animationId = requestAnimationFrame(loop);
})();
