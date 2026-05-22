// Simple endless runner based on IDEA.md
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // size canvas to fill its container or set fixed size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Game state
  let player = { x: canvas.width / 2, y: canvas.height - 60, w: 30, h: 30, speed: 5 };
  let time = 0; // elapsed time for animations
  let obstacles = [];
  let orbs = [];
  let energy = 100; // drains per second
  let score = 0;
  let lastTime = 0;
  let spawnTimer = 0;
  let orbTimer = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnObstacle() {
    const w = 40 + Math.random() * 60;
    const x = Math.random() * (canvas.width - w);
    obstacles.push({ x, y: -30, w, h: 20, speed: 3 + Math.random() * 2 });
  }
  function spawnOrb() {
    const r = 8;
    const x = Math.random() * (canvas.width - r * 2) + r;
    orbs.push({ x, y: -r, r, speed: 2.5 });
  }

  function update(dt) {
    if (gameOver) return;
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    // spawn obstacles/orbs
    spawnTimer += dt;
    orbTimer += dt;
    if (spawnTimer > 1000) { spawnObstacle(); spawnTimer = 0; }
    if (orbTimer > 1500) { spawnOrb(); orbTimer = 0; }

    // move obstacles
    obstacles.forEach(o => o.y += o.speed);
    obstacles = obstacles.filter(o => o.y < canvas.height);

    // move orbs
    orbs.forEach(o => o.y += o.speed);
    orbs = orbs.filter(o => o.y < canvas.height);

    // energy drain
    energy -= dt * 0.02; // ~1 per 50ms
    if (energy <= 0) gameOver = true;

    // collision detection (AABB for obstacles, circle for orbs)
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // play collision sound
        playTone(150, 300);
        gameOver = true;
        break;
      }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      const dx = (player.x + player.w / 2) - orb.x;
      const dy = (player.y + player.h / 2) - orb.y;
      const dist = Math.hypot(dx, dy);
      if (dist < orb.r + Math.max(player.w, player.h) / 2) {
        energy = Math.min(100, energy + 20);
        orbs.splice(i, 1);
        score += 10;
        // play orb collection sound
        playTone(400, 150);
      }
    }

    // distance based score
    score += dt * 0.01;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
// background grid with neon glow
  // dark background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, '#02010a');
  bgGradient.addColorStop(1, '#0a0015');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // neon grid lines
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 1;
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 4;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  // reset shadow for later drawing
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
    // player ship (neon triangle with glow)
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // obstacles (glowing red bars)
    ctx.fillStyle = '#f44';
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 6;
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // reset shadow after obstacles
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // orbs (glowing green circles)
    ctx.fillStyle = '#4f4';
    ctx.shadowColor = '#4f4';
    ctx.shadowBlur = 6;
    orbs.forEach(o => {
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // reset shadow after orbs
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Energy: ${Math.floor(energy)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    time += dt; // advance animation timer
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
