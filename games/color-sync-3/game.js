// Color Sync game – canvas id="game"
// Core logic: rotating dot, color change via arrow keys, random colored platforms, match to survive.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  const COLORS = ['red', 'green', 'blue', 'orange'];
  let dotColor = COLORS[0];
  let angle = 0; // radians
  let speed = 0.02; // angular speed
  let radius = Math.min(W, H) / 3;
  let platforms = [];
  const stars = [];
  // generate background stars
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.5 + 0.3,
    });
  }
  let platformTimer = 0;
  const platformInterval = 1500; // ms
  let lastTime = 0;
  let gameOver = false;
  let score = 0;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  const colorFreqMap = {
    red: 261.6,    // C4
    green: 329.6,  // E4
    blue: 392.0,   // G4
    orange: 523.3, // C5
  };
  function playColorChange() { playSound(colorFreqMap[dotColor] || 300); }
  function playSuccess() { playSound(800, 'triangle', 0.08); }
  function playGameOver() { playSound(150, 'sawtooth', 0.5); }

  // Input handling
  document.addEventListener('keydown', e => {
    if (gameOver) return;
    // Ensure AudioContext is running (required after user gesture)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.key === 'ArrowLeft') {
      const idx = (COLORS.indexOf(dotColor) - 1 + COLORS.length) % COLORS.length;
      dotColor = COLORS[idx];
      playColorChange();
    } else if (e.key === 'ArrowRight') {
      const idx = (COLORS.indexOf(dotColor) + 1) % COLORS.length;
      dotColor = COLORS[idx];
      playColorChange();
    }
  });

  function spawnPlatform() {
    const size = 80 + Math.random() * 40; // width
    const x = Math.random() * (W - size);
    const y = Math.random() * (H - 20) + 10; // avoid edges
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    platforms.push({ x, y, w: size, h: 10, color });
  }

  function update(dt) {
    if (gameOver) return;
    angle += speed * dt;
    // keep angle within 0-2π
    angle %= Math.PI * 2;

    // platform spawn
    platformTimer += dt;
    if (platformTimer > platformInterval) {
      spawnPlatform();
      platformTimer = 0;
    }

    // increase difficulty over time
    speed = 0.02 + score * 0.0005; // subtle increase
    // remove off‑screen platforms (not needed but keeps array small)
    platforms = platforms.filter(p => p.y < H + 20);

    // collision detection – check if dot is near a platform vertically
    const dotX = W / 2 + radius * Math.cos(angle);
    const dotY = H / 2 + radius * Math.sin(angle);
    let landed = false;
    for (const p of platforms) {
      if (
        dotY >= p.y && dotY <= p.y + p.h &&
        dotX >= p.x && dotX <= p.x + p.w
      ) {
        landed = true;
        if (p.color !== dotColor) {
          gameOver = true;
          playGameOver();
        } else {
          playSuccess();
        }
        break;
      }
    }
    if (!landed && (dotX < 0 || dotX > W || dotY < 0 || dotY > H)) {
      gameOver = true;
    }

    // scoring – survive longer
    score += dt;
  }

  function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#1e1e2f');
  bgGrad.addColorStop(1, '#0a0a13');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // draw background stars
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw platforms with rounded corners
  const cornerRadius = 4;
  for (const p of platforms) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(p.x + cornerRadius, p.y);
    ctx.lineTo(p.x + p.w - cornerRadius, p.y);
    ctx.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + cornerRadius);
    ctx.lineTo(p.x + p.w, p.y + p.h - cornerRadius);
    ctx.quadraticCurveTo(p.x + p.w, p.y + p.h, p.x + p.w - cornerRadius, p.y + p.h);
    ctx.lineTo(p.x + cornerRadius, p.y + p.h);
    ctx.quadraticCurveTo(p.x, p.y + p.h, p.x, p.y + p.h - cornerRadius);
    ctx.lineTo(p.x, p.y + cornerRadius);
    ctx.quadraticCurveTo(p.x, p.y, p.x + cornerRadius, p.y);
    ctx.closePath();
    ctx.fill();
  }

  // draw dot with glow
  const dotX = W / 2 + radius * Math.cos(angle);
  const dotY = H / 2 + radius * Math.sin(angle);
  const grad = ctx.createRadialGradient(dotX, dotY, 4, dotX, dotY, 12);
  grad.addColorStop(0, 'white');
  grad.addColorStop(0.4, dotColor);
  grad.addColorStop(1, 'black');
  ctx.shadowColor = dotColor;
  ctx.shadowBlur = 12;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // UI
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', W / 2, H / 2);
  }
}

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start loop
  requestAnimationFrame(loop);
})();
