// Simple game based on IDEA.md
// Canvas with id="game"
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Resume audio on user interaction (required by browsers)
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  const playTone = (freq, type = 'sine', duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 400;
  const height = canvas.height = 400;

  // Game state
  const player = { x: width / 2, y: height / 2, size: 10, speed: 2 };
  const gems = [];
  const spikes = [];
  let score = 0;
  let timeLeft = 60; // seconds
  let lastTime = performance.now();
  let gameOver = false;

  // Helper functions
  const randPos = () => ({
    x: Math.random() * (width - 20) + 10,
    y: Math.random() * (height - 20) + 10,
  });

  // Populate gems and spikes
  for (let i = 0; i < 5; i++) gems.push({ ...randPos(), size: 6, collected: false });
  for (let i = 0; i < 3; i++) {
    const pos = randPos();
    spikes.push({ x: pos.x, y: pos.y, size: 8, dir: 1, range: 60, origin: pos.x });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const update = (delta) => {
    if (gameOver) return;
    // Move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside bounds
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));

    // Update spikes (horizontal oscillation)
    spikes.forEach(s => {
      s.x += s.dir * 1.5;
      if (Math.abs(s.x - s.origin) > s.range) s.dir *= -1;
    });

    // Check collisions with gems
    gems.forEach(g => {
      if (!g.collected && Math.hypot(g.x - player.x, g.y - player.y) < (g.size + player.size)) {
        g.collected = true;
        score++;
        playTone(800, 'sine', 0.1);
      }
    });

    // Check collisions with spikes
    spikes.forEach(s => {
if (Math.hypot(s.x - player.x, s.y - player.y) < (s.size + player.size)) {
          playTone(200, 'sawtooth', 0.3);
          gameOver = true;
        }
    });

    // Timer
    timeLeft -= delta / 1000;
    if (timeLeft <= 0) gameOver = true;
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw player with gradient
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.size * 0.2,
      player.x, player.y, player.size
    );
    playerGrad.addColorStop(0, '#00f');
    playerGrad.addColorStop(1, '#003');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    // Draw gems with sparkle gradient
    const gemGrad = ctx.createRadialGradient(0,0,0,0,0,1);
    gems.forEach(g => {
      if (!g.collected) {
        const grad = ctx.createRadialGradient(
          g.x, g.y, g.size * 0.2,
          g.x, g.y, g.size
        );
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#aa5');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // Draw spikes with gradient shading
    spikes.forEach(s => {
      const spikeGrad = ctx.createLinearGradient(s.x, s.y - s.size, s.x, s.y + s.size);
      spikeGrad.addColorStop(0, '#f55');
      spikeGrad.addColorStop(1, '#800');
      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.size);
      ctx.lineTo(s.x - s.size, s.y + s.size);
      ctx.lineTo(s.x + s.size, s.y + s.size);
      ctx.closePath();
      ctx.fill();
    });
    // UI
    ctx.fillStyle = 'black';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, Math.ceil(timeLeft))}`, 10, 38);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = (now) => {
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
