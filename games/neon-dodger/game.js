// Simple endless runner based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // Set canvas size to match displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const player = {
    w: 30,
    h: 30,
    x: canvas.width / 2 - 15,
    y: canvas.height - 50,
    speed: 5,
    color: '#0ff'
  };

  const obstacles = [];
  const obsFreq = 90; // frames between spawns
  let frame = 0;
  let score = 0;
  let running = true;

  const drawRounded = (obj) => {
    // Neon glow effect
    ctx.save();
    ctx.fillStyle = obj.color;
    ctx.shadowColor = obj.color;
    ctx.shadowBlur = 12;
    const radius = 6;
    const {x, y, w, h} = obj;
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

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (canvas.width - size);
    obstacles.push({
      x,
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
      color: '#f0f'
    });
  };

  const update = () => {
    // move player based on input state
    if (left) player.x -= player.speed;
    if (right) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    // obstacles
    obstacles.forEach(o => o.y += o.speed);
    // remove off‑screen
    while (obstacles.length && obstacles[0].y > canvas.height) obstacles.shift();
    // collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        running = false;
        playTone(220, 0.3); // collision sound
        break;
      }
    }
    if (running) score++;
  };

  const render = () => {
    // Draw neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001'); // dark teal
    bgGrad.addColorStop(1, '#020'); // dark purple
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRounded(player);
    obstacles.forEach(drawRounded);
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    if (!running) {
      ctx.fillStyle = '#f44';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  // Input handling
  let left = false, right = false;
  const keyDown = (e) => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
  };
  const keyUp = (e) => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  // Touch swipe handling (simple left/right detection)
  let touchStartX = null;
  canvas.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
  canvas.addEventListener('touchmove', e => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    if (delta > 15) right = true, left = false;
    else if (delta < -15) left = true, right = false;
  });
  canvas.addEventListener('touchend', () => { left = right = false; touchStartX = null; });

  const loop = () => {
    if (!running) { render(); return; }
    if (frame % obsFreq === 0) { spawnObstacle(); playTone(330, 0.1); }
    update();
    render();
    frame++;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
