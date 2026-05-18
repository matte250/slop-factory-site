// game.js – Minimal Falling Blocks Escape implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
    if (!canvas) return console.error('Canvas with id "game" not found');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Sound setup using Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, duration = 0.1, type = 'sine') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }
    function playCollisionSound() { playTone(150, 0.2, 'square'); }
    function playPowerUpSound() { playTone(440, 0.15, 'triangle'); }
    function playGameOverSound() { playTone(80, 0.6, 'sawtooth'); }

  // Player
  const player = { w: 20, h: 20, x: W / 2 - 10, y: H - 30, speed: 4, alive: true, immune: false };

  // Falling blocks
  const blocks = [];
  const blockSize = { w: 30, h: 30 };
  const blockSpeed = 2;
  const spawnInterval = 1500; // ms

  // Power‑ups (temporary immunity)
  const powerUps = [];
  const powerUpSize = 15;
  const powerUpDuration = 4000; // ms
  const powerUpSpawnChance = 0.02; // per frame

  let lastSpawn = 0;
  let startTime = performance.now();
  let score = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBlock() {
    const x = Math.random() * (W - blockSize.w);
    blocks.push({ x, y: -blockSize.h, w: blockSize.w, h: blockSize.h });
  }

  function spawnPowerUp() {
    const x = Math.random() * (W - powerUpSize);
    powerUps.push({ x, y: -powerUpSize, radius: powerUpSize / 2, active: false, start: 0 });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectIntersect(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.radius) return false;
    if (distY > rect.h / 2 + circle.radius) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  function drawRoundedRect(x, y, w, h, r, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

function update(dt) {
    // player movement
    if (keys.ArrowLeft) player.x = Math.max(0, player.x - player.speed);
    if (keys.ArrowRight) player.x = Math.min(W - player.w, player.x + player.speed);

    // spawn blocks
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnBlock();
      lastSpawn = performance.now();
    }

    // possibly spawn power‑up
    if (Math.random() < powerUpSpawnChance) spawnPowerUp();

    // move blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += blockSpeed;
      if (b.y > H) blocks.splice(i, 1);
      else if (!player.immune && rectIntersect(player, b)) {
        playCollisionSound();
        playGameOverSound();
        player.alive = false;
      }
    }

    // move power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += blockSpeed;
      if (!p.active && circleRectIntersect({ x: p.x + p.radius, y: p.y + p.radius, radius: p.radius }, player)) {
        p.active = true;
        p.start = performance.now();
        player.immune = true;
        playPowerUpSound();
      }
      if (p.active && performance.now() - p.start > powerUpDuration) {
        player.immune = false;
        powerUps.splice(i, 1);
      } else if (p.y > H) {
        powerUps.splice(i, 1);
      }
    }

    // score based on survival time
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0e0e0e');
    bgGrad.addColorStop(1, '#302d2d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // player (rounded rectangle)
    ctx.fillStyle = player.immune ? 'gold' : '#1e90ff';
    drawRoundedRect(player.x, player.y, player.w, player.h, 4, ctx.fillStyle);
    // blocks (rounded rectangles)
    ctx.fillStyle = '#b22222';
    blocks.forEach(b => drawRoundedRect(b.x, b.y, b.w, b.h, 3, ctx.fillStyle));
    // power‑ups (glowing circles)
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(
        p.x + p.radius,
        p.y + p.radius,
        p.radius * 0.2,
        p.x + p.radius,
        p.y + p.radius,
        p.radius
      );
      grad.addColorStop(0, p.active ? 'rgba(255,215,0,0.9)' : 'rgba(50,205,50,0.8)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + p.radius, p.y + p.radius, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  function loop(timestamp) {
    if (!player.alive) {
      // Play game over sound once
      if (!player.gameOverPlayed) {
        playGameOverSound();
        player.gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.fillText(`Final Score: ${score}s`, W / 2, H / 2 + 40);
      return;
    }
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  let lastFrame = null;
  requestAnimationFrame(loop);
})();
