// Neon Escape – minimal endless runner
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  onkeydown = (e) => { resumeAudio(); keys[e.key] = true; };
  onkeyup = (e) => { keys[e.key] = false; };
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);

  const player = { x: innerWidth / 2, y: innerHeight - 40, radius: 12, speed: 5, boost: false };
  const keys = {};
  onkeydown = e => (keys[e.key] = true);
  onkeyup = e => (keys[e.key] = false);

  // tunnel slices: each slice = { y, left, right }
  const tunnel = [];
  const sliceHeight = 30;
  const baseWidth = innerWidth * 0.6;
  const amplitude = innerWidth * 0.2;
  let offset = 0;
  const genSlice = (y) => {
    const t = (y + offset) / 200;
    const center = innerWidth / 2 + Math.sin(t) * amplitude;
    const half = baseWidth / 2;
    return { y, left: center - half, right: center + half };
  };

  const initTunnel = () => {
    tunnel.length = 0;
    for (let y = 0; y < innerHeight; y += sliceHeight) tunnel.push(genSlice(y));
  };
  initTunnel();

  let last = 0, score = 0, speed = 2, running = true;
  const gameLoop = (t) => {
    if (!running) return;
    const delta = (t - last) / 16; // approx 60fps units
    last = t;
    // move tunnel up (player forward)
    tunnel.forEach(s => s.y -= speed * delta);
    // remove off‑screen slices and add new ones at bottom
    while (tunnel.length && tunnel[0].y < -sliceHeight) tunnel.shift();
    const lastY = tunnel[tunnel.length - 1]?.y || 0;
    while (lastY < innerHeight) {
      const newY = (tunnel[tunnel.length - 1]?.y || 0) + sliceHeight;
      tunnel.push(genSlice(newY));
    }
    // input
    if (keys['ArrowLeft'] || keys['a']) player.x -= (player.boost ? 2 : 1) * player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += (player.boost ? 2 : 1) * player.speed;
    player.boost = keys[' '] || false;
    if (player.boost) playBeep(800, 0.12);
    // bounds
    const slice = tunnel.find(s => s.y + sliceHeight > player.y && s.y <= player.y);
    if (slice && (player.x - player.radius < slice.left || player.x + player.radius > slice.right)) {
      running = false; // crash
      playBeep(200, 0.3);
    }
    // keep player inside canvas
    player.x = Math.max(player.radius, Math.min(innerWidth - player.radius, player.x));
    // score & speed
    score += delta;
    speed = 2 + Math.floor(score / 5000) * 0.5;
    // draw enhanced graphics
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // tunnel walls with neon glow
    ctx.strokeStyle = 'rgba(0,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    tunnel.forEach((s, i) => {
      const prev = i === 0 ? s.left : tunnel[i - 1].left;
      ctx.moveTo(prev, s.y);
      ctx.lineTo(s.left, s.y + sliceHeight);
    });
    ctx.stroke();
    ctx.beginPath();
    tunnel.forEach((s, i) => {
      const prev = i === 0 ? s.right : tunnel[i - 1].right;
      ctx.moveTo(prev, s.y);
      ctx.lineTo(s.right, s.y + sliceHeight);
    });
    ctx.stroke();

    // optional: glowing particles (simple implementation)
    if (!window.__particles) window.__particles = [];
    const particles = window.__particles;
    // spawn particles near player when boosting
    if (player.boost) {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: player.x + (Math.random() - 0.5) * 20,
          y: player.y + player.radius,
          r: Math.random() * 3 + 2,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 1 + 0.5,
          life: 30
        });
      }
    }
    // update and draw particles
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;

    // player with inner glow
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,0,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 100), 10, 30);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    } else {
      requestAnimationFrame(gameLoop);
    }
  };
  requestAnimationFrame(gameLoop);
})();
