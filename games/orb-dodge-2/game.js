// Simple Orb Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects (created lazily)
  let audioCtx;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  const playBeep = (freq, duration) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  };

  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 10,
    speed: 200, // pixels per second
    color: '#00f'
  };

  const hazards = [];
  const hazardSpeed = 80; // pixels per second towards center
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;
  let running = true;

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const spawnHazard = () => {
    // spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -15;
        break;
      case 1: // right
        x = canvas.width + 15;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 15;
        break;
      case 3: // left
        x = -15;
        y = Math.random() * canvas.height;
        break;
    }
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    hazards.push({ x, y, r: 12, angle, color: '#f00' });
    // play spawn sound
    initAudio();
    playBeep(300, 0.08);
  };

  const update = (dt) => {
    // move player
    const move = player.speed * dt;
    if (keys.ArrowUp) player.y -= move;
    if (keys.ArrowDown) player.y += move;
    if (keys.ArrowLeft) player.x -= move;
    if (keys.ArrowRight) player.x += move;
    // keep inside canvas
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    // spawn hazards
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnHazard();
      lastSpawn = performance.now();
    }

    // move hazards toward center
    hazards.forEach(h => {
      h.x += Math.cos(h.angle) * hazardSpeed * dt;
      h.y += Math.sin(h.angle) * hazardSpeed * dt;
    });

    // remove off‑screen hazards (past center)
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      const distToCenter = Math.hypot(h.x - canvas.width / 2, h.y - canvas.height / 2);
      if (distToCenter < 5) hazards.splice(i, 1);
    }

    // collision detection
    for (const h of hazards) {
      const d = Math.hypot(player.x - h.x, player.y - h.y);
      if (d < player.r + h.r) {
        // collision sound
        initAudio();
        playBeep(150, 0.2);
        running = false;
        break;
      }
    }

    if (running) score += dt;
  };

  const draw = () => {
    // subtle background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#f0e0ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // player with radial gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,255,0.5)';
    ctx.shadowBlur = 8;
    const pGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r);
    pGrad.addColorStop(0, '#66aaff');
    pGrad.addColorStop(1, '#0033ff');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // hazards with radial gradients and slight glow
    hazards.forEach(h => {
      ctx.save();
      ctx.shadowColor = 'rgba(255,0,0,0.4)';
      ctx.shadowBlur = 6;
      const hGrad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
      hGrad.addColorStop(0, '#ff7777');
      hGrad.addColorStop(1, '#ff0000');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // score with subtle styling
    ctx.fillStyle = '#222';
    ctx.font = '16px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + Math.floor(score), 10, 10);

    // game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over – Press R to Restart', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = (timestamp) => {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame((t) => { lastTime = t; loop(t); });

  // restart key
  window.addEventListener('keydown', e => {
    if (!running && e.key.toLowerCase() === 'r') {
      // reset state with restart sound
      initAudio();
      playBeep(400, 0.15);
      hazards.length = 0;
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      score = 0;
      running = true;
      lastSpawn = performance.now();
    }
  });
})();
