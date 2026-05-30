// Cosmic Reflections – enhanced graphics
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;
  const CENTER = { x: W / 2, y: H / 2 };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Continuous laser hum
  const laserOsc = audioCtx.createOscillator();
  const laserGain = audioCtx.createGain();
  laserOsc.type = 'sawtooth';
  laserOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
  laserGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  laserOsc.connect(laserGain).connect(audioCtx.destination);
  laserOsc.start();
  // Hit sound helper
  function playHitSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  // Game over sound helper
  function playGameOverSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }

  // Game state
  let angle = 0; // mirror orientation (radians)
  let targets = [];
  let score = 0;
  let lastHit = Date.now();
  let gameOver = false;
  let gameOverSoundPlayed = false;

  // Controls – mouse moves set mirror angle
  canvas.addEventListener('mousemove', e => {
    // Ensure audio context is running (required after user interaction)
    audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    angle = Math.atan2(my - CENTER.y, mx - CENTER.x);
  });
  // Arrow keys as fallback
  window.addEventListener('keydown', e => {
    const step = 0.1;
    if (e.key === 'ArrowLeft') angle -= step;
    if (e.key === 'ArrowRight') angle += step;
  });

  // Spawn a new target at a random edge, moving inward.
  function spawnTarget() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    switch (side) {
      case 0: // left
        x = 0; y = Math.random() * H; vx = speed; vy = (Math.random() - 0.5) * speed;
        break;
      case 1: // right
        x = W; y = Math.random() * H; vx = -speed; vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // top
        x = Math.random() * W; y = 0; vx = (Math.random() - 0.5) * speed; vy = speed;
        break;
      default: // bottom
        x = Math.random() * W; y = H; vx = (Math.random() - 0.5) * speed; vy = -speed;
    }
    targets.push({ x, y, vx, vy, r: 8 });
  }

  // Simple line‑point distance (infinite line) used for hit detection.
  function pointLineDist(px, py, ax, ay, bx, by) {
    const num = Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax);
    const den = Math.hypot(by - ay, bx - ax);
    return num / den;
  }

  function update(dt) {
    // Move targets
    targets.forEach(t => { t.x += t.vx; t.y += t.vy; });
    // Remove off‑screen targets → lose condition
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if (t.x < 0 || t.x > W || t.y < 0 || t.y > H) {
        gameOver = true;
        break;
      }
    }
    // Lose if no hit for >3 s
    if (Date.now() - lastHit > 3000) gameOver = true;

    // Play game over sound once
    if (gameOver && !gameOverSoundPlayed) {
      playGameOverSound();
      gameOverSoundPlayed = true;
    }
    if (gameOver) return;

    // Laser line (center → far point in mirror direction)
    const laserLen = Math.max(W, H);
    const ax = CENTER.x;
    const ay = CENTER.y;
    const bx = CENTER.x + Math.cos(angle) * laserLen;
    const by = CENTER.y + Math.sin(angle) * laserLen;

    // Check hits
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      const dist = pointLineDist(t.x, t.y, ax, ay, bx, by);
      // also ensure target is in front of the mirror (dot product positive)
      const dot = (t.x - ax) * Math.cos(angle) + (t.y - ay) * Math.sin(angle);
      if (dist < t.r && dot > 0) {
        score++;
        lastHit = Date.now();
        targets.splice(i, 1);
        playHitSound();
      }
    }

    // Auto‑spawn every 1.5 s
    if (Date.now() % 1500 < dt) spawnTarget();
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Starfield (twinkling)
    ctx.save();
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // slight flicker
      s.alpha += (Math.random() - 0.5) * 0.02;
      s.alpha = Math.min(1, Math.max(0.3, s.alpha));
    });
    ctx.restore();

    // Laser with gradient glow
    const gradient = ctx.createLinearGradient(CENTER.x, CENTER.y, CENTER.x + Math.cos(angle) * Math.max(W, H), CENTER.y + Math.sin(angle) * Math.max(W, H));
    gradient.addColorStop(0, 'rgba(255,0,0,0.8)');
    gradient.addColorStop(1, 'rgba(255,0,0,0.1)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CENTER.x, CENTER.y);
    ctx.lineTo(CENTER.x + Math.cos(angle) * Math.max(W, H), CENTER.y + Math.sin(angle) * Math.max(W, H));
    ctx.stroke();

    // Mirror (short segment with metallic look)
    const mLen = 30;
    const mirrorGrad = ctx.createLinearGradient(CENTER.x, CENTER.y, CENTER.x + Math.cos(angle) * mLen, CENTER.y + Math.sin(angle) * mLen);
    mirrorGrad.addColorStop(0, '#bbb');
    mirrorGrad.addColorStop(1, '#666');
    ctx.strokeStyle = mirrorGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(CENTER.x, CENTER.y);
    ctx.lineTo(CENTER.x + Math.cos(angle) * mLen, CENTER.y + Math.sin(angle) * mLen);
    ctx.stroke();

    // Targets with glow
    targets.forEach(t => {
      const radGrad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * 2);
      radGrad.addColorStop(0, 'rgba(0,255,255,0.9)');
      radGrad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 2, 0, Math.PI * 2);
      ctx.fill();
      // core
      ctx.fillStyle = 'cyan';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    // Game‑over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(ts) {
    const dt = ts - last;
    last = ts;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
