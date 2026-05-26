// Minimal endless‑runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // full‑screen canvas
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };

  // background stars for depth
  const stars = [];
  const initStars = () => {
    const count = Math.floor(canvas.width * canvas.height * 0.00004);
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, z: Math.random() * 0.5 + 0.5 });
    }
  };
  const updateStars = () => {
    for (const s of stars) {
      s.x -= speed * s.z * 0.3;
      if (s.x < 0) { s.x = canvas.width; s.y = Math.random() * canvas.height; }
    }
  };
  const drawStars = () => {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.z;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;
  };
  // initialize stars now and on resize
  initStars();
  const onResize = () => { resize(); initStars(); };
  addEventListener('resize', onResize);

  const player = { x: 80, y: 0, r: 15, vy: 0, onGround: false, trail: [] };
  const gravity = 0.6;
  const jump = -12;
  let speed = 4; // world scroll speed
  const spikes = [];
  const spikeW = 30;
  const spikeGap = 200; // distance between spikes
  let nextSpikeX = canvas.width + 100;
  let gameOver = false;
  let score = 0;

  const createSpike = (x) => {
    const h = 40 + Math.random() * 60;
    return { x, y: canvas.height - h, w: spikeW, h };
  };

  const updateSpikes = () => {
    // move existing
    spikes.forEach(s => s.x -= speed);
    // remove off‑screen
    while (spikes.length && spikes[0].x + spikeW < 0) spikes.shift();
    // add new spikes
    while (nextSpikeX < canvas.width + spikeGap) {
      spikes.push(createSpike(nextSpikeX));
      nextSpikeX += spikeW + spikeGap + Math.random() * 100;
    }
  };

  const checkCollision = () => {
    for (const s of spikes) {
      // simple AABB vs circle
      const cx = player.x, cy = player.y;
      const nearestX = Math.max(s.x, Math.min(cx, s.x + s.w));
      const nearestY = Math.max(s.y, Math.min(cy, s.y + s.h));
      const dx = cx - nearestX, dy = cy - nearestY;
      if (dx * dx + dy * dy < player.r * player.r) return true;
    }
    return false;
  };

  const drawPlayer = () => {
    // trail
    player.trail.push({ x: player.x, y: player.y, life: 15 });
    if (player.trail.length > 30) player.trail.shift();
    ctx.fillStyle = '#0ff';
    for (const t of player.trail) {
      ctx.globalAlpha = t.life / 15;
      ctx.beginPath();
      ctx.arc(t.x, t.y, player.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      t.life--;
    }
    ctx.globalAlpha = 1;
    // main orb with glow
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 2);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, '#0ff');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSpikes = () => {
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 100);
    gradient.addColorStop(0, '#a00');
    gradient.addColorStop(1, '#ff4');
    ctx.fillStyle = gradient;
    spikes.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x, canvas.height);
      ctx.lineTo(s.x, s.y);
      ctx.lineTo(s.x + s.w, s.y);
      ctx.lineTo(s.x + s.w, canvas.height);
      ctx.closePath();
      ctx.fill();
    });
  };

  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Score: ' + Math.floor(score), canvas.width / 2, canvas.height / 2 + 60);
      return;
    }
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    updateStars();
    drawStars();

    // player physics
    player.vy += gravity;
    player.y += player.vy;
    const floor = canvas.height - 30;
    if (player.y + player.r > floor) {
      player.y = floor - player.r;
      player.vy = 0;
      player.onGround = true;
    } else player.onGround = false;
    // world update
    updateSpikes();
    // collision
    if (checkCollision()) gameOver = true;
    // draw entities
    drawPlayer();
    drawSpikes();
    // score & speed increase
    score += speed * 0.1;
    speed += 0.001;
    requestAnimationFrame(loop);
  };

  canvas.addEventListener('click', () => {
    resumeAudio();
    if (player.onGround) {
      player.vy = jump;
      playBeep(600, 0.08);
    }
  });
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    resumeAudio();
    if (player.onGround) {
      player.vy = jump;
      playBeep(600, 0.08);
    }
  }, { passive: false });
  // start
  player.y = canvas.height - 30 - player.r;
  loop();
})();
