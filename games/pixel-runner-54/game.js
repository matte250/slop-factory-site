// Minimal endless runner for canvas with id "game"
// Player: small square that runs automatically, jumps with space / click
// Obstacles: randomly generated vertical spikes (rectangles)
// Simple physics: gravity, jump velocity, ground level
// Score increments over time; stop on collision.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playTone(440, 0.1);
  const playCrash = () => playTone(150, 0.3);
  const startMusic = () => {
    // simple background loop
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    // keep reference to stop later if needed
    window._bgOsc = osc;
  };
  const stopMusic = () => {
    if (window._bgOsc) { window._bgOsc.stop(); window._bgOsc = null; }
  };

  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;

  const groundY = height - 30; // ground position
  const player = { x: 50, y: groundY, w: 20, h: 20, vy: 0, jumpStrength: -8 };
  const gravity = 0.4;
  const obstacles = [];
  let frame = 0;
  let score = 0;
  let running = true;

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 20; // width/height 20-40
    obstacles.push({ x: width, y: groundY - size, w: size, h: size });
  };

  const reset = () => {
    player.y = groundY;
    player.vy = 0;
    obstacles.length = 0;
    frame = 0;
    score = 0;
    running = true;
    stopMusic();
    requestAnimationFrame(loop);
  };

  const handleInput = (e) => {
    if (!running) { reset(); return; }
    if (player.y >= groundY) {
      player.vy = player.jumpStrength;
      playJump();
      if (!window._bgOsc) startMusic(); // start music on first jump
    }
  };

  window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleInput(e); });
  canvas.addEventListener('pointerdown', handleInput);

  const checkCollision = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  function loop() {
    if (!running) return;
    frame++;
    // Clear
    ctx.clearRect(0, 0, width, height);
    // Background sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#87CEEB'); // light blue
    skyGradient.addColorStop(1, '#fff');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    // Ground with gradient
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, height);
    groundGradient.addColorStop(0, '#654321');
    groundGradient.addColorStop(1, '#2c1a0d');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, width, height - groundY);
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y > groundY) { player.y = groundY; player.vy = 0; }
    // Draw player with rounded corners and shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(player.x+2, player.y - player.h+2, player.w, player.h, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y - player.h, player.w, player.h, 4);
    ctx.fill();
    // Spawn obstacles periodically
    if (frame % 120 === 0) spawnObstacle(); // every 2 seconds at 60fps
    // Update and draw obstacles with gradient spikes
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // move left
      // Spike shape (upward triangle)
      ctx.save();
      const spikeGrad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      spikeGrad.addColorStop(0, '#ff8c00'); // orange top
      spikeGrad.addColorStop(1, '#d2691e'); // brown bottom
      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h); // bottom left
      ctx.lineTo(o.x + o.w / 2, o.y); // top middle
      ctx.lineTo(o.x + o.w, o.y + o.h); // bottom right
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // collision (approx using bounding box of triangle)
      if (checkCollision(player, o)) { playCrash(); stopMusic(); running = false; }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Score (styled)
    score += 0.1;
    ctx.save();
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
    ctx.strokeText('Score: ' + Math.floor(score), 10, 30);
    ctx.restore();
    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over — Press Space or Click to Restart', width / 2, height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
