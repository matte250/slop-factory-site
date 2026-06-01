// Neon Runner game implementation
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => playSound(300);
  const playHitSound = () => playSound(100);


  // Set canvas size (full window or fixed)
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = 200);

  // Game constants
  const PLAYER_SIZE = 30;
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPIKE_WIDTH = 20;
  const SPIKE_HEIGHT = 40;
  const SCROLL_SPEED = 4;

  // State
  let player = { x: 50, y: H - PLAYER_SIZE, vy: 0, onGround: true };
  let spikes = [];
  let frame = 0;
  let score = 0;
  let running = true;

  // Input handling (click / tap)
  const jump = () => {
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    }
  };
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  // Spike generation
  const maybeAddSpike = () => {
    // Roughly every 90 frames add a spike at right edge
    if (frame % 90 === 0) {
      spikes.push({ x: W, y: H - SPIKE_HEIGHT, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
    }
  };

  // Collision detection
  const collides = (a, b) => {
    return a.x < b.x + b.w && a.x + PLAYER_SIZE > b.x && a.y < b.y + b.h && a.y + PLAYER_SIZE > b.y;
  };

  const update = () => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > H - PLAYER_SIZE) {
      player.y = H - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    }

    // Move spikes leftward
    for (let i = spikes.length - 1; i >= 0; i--) {
      spikes[i].x -= SCROLL_SPEED;
      if (spikes[i].x + spikes[i].w < 0) spikes.splice(i, 1);
    }

    // Check collisions
    for (const s of spikes) {
      if (collides(player, s)) {
        playHitSound();
        running = false;
        break;
      }
    }

    // Score increments by distance (frames * speed)
    if (running) score = Math.floor(frame / 2);
  };

  const draw = () => {
    // Dynamic neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Starfield effect for depth (simple moving dots)
    ctx.fillStyle = '#44a';
    for (let i = 0; i < 30; i++) {
      const sx = (frame * 2 + i * 100) % W;
      const sy = (i * 7) % H;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Player with neon glow and rounded corners
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    const r = 6; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + PLAYER_SIZE - r, player.y);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y, player.x + PLAYER_SIZE, player.y + r);
    ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE - r);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE, player.x + PLAYER_SIZE - r, player.y + PLAYER_SIZE);
    ctx.lineTo(player.x + r, player.y + PLAYER_SIZE);
    ctx.quadraticCurveTo(player.x, player.y + PLAYER_SIZE, player.x, player.y + PLAYER_SIZE - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Spikes rendered as triangles with gradient
    const spikeGrad = ctx.createLinearGradient(0, H - SPIKE_HEIGHT, 0, H);
    spikeGrad.addColorStop(0, '#f44');
    spikeGrad.addColorStop(1, '#800');
    ctx.fillStyle = spikeGrad;
    for (const s of spikes) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    }

    // Score display with neon font
    ctx.fillStyle = '#0ff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);

    if (!running) {
      // Dim overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      // Game Over text
      ctx.fillStyle = '#ff0';
      ctx.font = '36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2 - 20);
      ctx.font = '24px monospace';
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 20);
    }
  };

  const loop = () => {
    if (!running) { draw(); return; }
    frame++;
    maybeAddSpike();
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Start the game loop
  requestAnimationFrame(loop);
})();
