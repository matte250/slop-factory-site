// Neon Dodge game implementation
// Canvas with id="game" must exist in the HTML
(() => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // Simple tone generator
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Resume audio context on first user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  }
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  // Original game code continues below
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.offsetWidth || 800);
  const h = (canvas.height = canvas.offsetHeight || 600);

  const player = { x: w / 2, y: h - 40, size: 20, dx: 0, speed: 4 };
  let obstacles = [];
  let orbs = [];
  let score = 0;
  let hits = 0;
  const maxHits = 3;
  let gameOver = false;

  const keys = { ArrowLeft: false, ArrowRight: false };
  document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: Math.random() * (w - size), y: -size, size });
  }
  function spawnOrb() {
    const r = 8 + Math.random() * 5;
    orbs.push({ x: Math.random() * (w - 2 * r) + r, y: -r, r });
  }

  let obstacleTimer = 0;
  let orbTimer = 0;

  function update(dt) {
    if (gameOver) return;
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(0, Math.min(w, player.x));

    // spawn logic
    obstacleTimer += dt;
    orbTimer += dt;
    if (obstacleTimer > 800) { spawnObstacle(); obstacleTimer = 0; }
    if (orbTimer > 1200) { spawnOrb(); orbTimer = 0; }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += 3;
      // collision with player (simple AABB)
        if (
          o.x < player.x + player.size &&
          o.x + o.size > player.x - player.size &&
          o.y + o.size > player.y - player.size &&
          o.y < player.y + player.size
        ) {
          hits++;
          obstacles.splice(i, 1);
          // play hit sound
          playTone(200, 0.15, 'square');
          if (hits >= maxHits) {
            gameOver = true;
            // play game over sound
            playTone(100, 0.5, 'sawtooth');
          }
          continue;
        }
      if (o.y > h) obstacles.splice(i, 1);
    }

    // move orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.y += 3;
      const dx = orb.x - player.x;
      const dy = orb.y - player.y;
if (Math.hypot(dx, dy) < orb.r + player.size) {
          score++;
          // play collect sound
          playTone(600, 0.08, 'triangle');
          orbs.splice(i, 1);
          continue;
        }
      if (orb.y - orb.r > h) orbs.splice(i, 1);
    }
  }

  function drawTriangle(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    // background with vertical neon gradient and motion blur
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#001133');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    // slight opacity to create trailing effect
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1.0;

    // player (neon blue)
    drawTriangle(player.x, player.y, player.size, '#0ff');

    // obstacles (neon red spikes)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => drawTriangle(o.x + o.size / 2, o.y + o.size / 2, o.size / 2, '#f00'));

    // orbs (neon cyan) with glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    orbs.forEach(orb => {
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // reset shadow for other drawings
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Hits: ${hits}/${maxHits}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = '#f88';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
