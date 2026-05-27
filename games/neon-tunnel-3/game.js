// Simple neon tunnel game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = canvas.clientWidth * DPR;
    canvas.height = canvas.clientHeight * DPR;
    ctx.scale(DPR, DPR);
  };
  window.addEventListener('resize', resize);
  resize();

  // Game objects
  const player = { x: canvas.width / 2, y: canvas.height * 0.8, radius: 8, speed: 3 };

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  // Background hum (low frequency, looping)
  const startBackground = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 40;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, audioCtx.currentTime + 0.5);
    osc.start();
    // keep reference to stop later if needed
    window._bgOsc = osc;
    window._bgGain = gain;
  };
  startBackground();
  const keys = {};
  const orbs = [];
  const spikes = [];
  let speed = 2; // tunnel scroll speed
  let score = 0;
  let gameOver = false;

  // Input
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Ensure audio context is running after first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const spawnOrb = () => {
    const size = 6;
    const x = rand(size, canvas.width - size);
    const y = -size;
    orbs.push({ x, y, size, speed: speed + 0.5 });
  };
  const spawnSpike = () => {
    const w = 12, h = 16;
    const x = rand(0, canvas.width - w);
    const y = -h;
    spikes.push({ x, y, w, h, speed: speed + 1 });
  };

  // Main loop
  const loop = () => {
    if (gameOver) { drawGameOver(); return; }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  const update = () => {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // keep inside canvas
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // spawn objects
    if (Math.random() < 0.02) spawnOrb();
    if (Math.random() < 0.015) spawnSpike();

    // move orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.speed;
      // collision
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      if (dx * dx + dy * dy < (o.size + player.radius) ** 2) {
        // Orb collected: increase score and play sound
        score += 10;
        speed += 0.05; // slight boost
        playTone(660, 0.1);
        orbs.splice(i, 1);
        continue;
      }
      if (o.y - o.size > canvas.height) orbs.splice(i, 1);
    }
    // move spikes
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.y += s.speed;
      // simple AABB collision
      if (
        player.x + player.radius > s.x &&
        player.x - player.radius < s.x + s.w &&
        player.y + player.radius > s.y &&
        player.y - player.radius < s.y + s.h
      ) {
gameOver = true;
          // Play crash sound
          playTone(150, 0.4);
          break;
      }
      if (s.y - s.h > canvas.height) spikes.splice(i, 1);
    }
  };

  const draw = () => {
    // Clear with black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Neon tunnel effect: concentric lines fading outward
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 40; i++) {
      const depth = i / 40;
      const offset = Date.now() / 1000 * (speed + 0.5) * (1 + depth);
      const x = canvas.width / 2 + Math.sin(offset + i) * (canvas.width / 2) * (1 - depth);
      const y = canvas.height * depth;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Orbs with radial glow
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.size * 3);
      grad.addColorStop(0, 'rgba(255,255,0,0.8)');
      grad.addColorStop(0.6, 'rgba(255,255,0,0.3)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size * 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Spikes with neon outline
    spikes.forEach(s => {
      ctx.shadowColor = '#f00';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f33';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Player ship with cyan glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.radius);
    ctx.lineTo(player.x - player.radius, player.y + player.radius);
    ctx.lineTo(player.x + player.radius, player.y + player.radius);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score display
    ctx.fillStyle = '#0ff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  };

  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), canvas.width/2, canvas.height/2 + 40);
  };

  // start loop
  requestAnimationFrame(loop);
})();
