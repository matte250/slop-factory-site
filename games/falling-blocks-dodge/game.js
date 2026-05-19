// Minimal Falling Blocks Dodge game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio context and simple beep function
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Player
  const player = { w: 30, h: 30, x: width / 2 - 15, y: height - 40, speed: 5, shield: false, shieldTimer: 0 };

  // Entities
  const blocks = [];
  const stars = [];
  let blockSpawnTimer = 0;
  let starSpawnTimer = 0;
  let blockSpeed = 2;
  let score = 0;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnBlock() {
    const size = 20 + Math.random() * 20;
    const x = Math.random() * (width - size);
    blocks.push({ x, y: -size, w: size, h: size });
    beep(200, 100); // block spawn sound
  }

  function spawnStar() {
    const size = 15;
    const x = Math.random() * (width - size);
    stars.push({ x, y: -size, w: size, h: size, collected: false });
  }

  function update(dt) {
    // Player movement
    if (keys['ArrowLeft']) player.x = Math.max(0, player.x - player.speed);
    if (keys['ArrowRight']) player.x = Math.min(width - player.w, player.x + player.speed);

    // Update blocks
    blockSpawnTimer -= dt;
    if (blockSpawnTimer <= 0) {
      spawnBlock();
      blockSpawnTimer = 800 - Math.min(600, score * 10); // faster over time
    }
    blocks.forEach(b => b.y += blockSpeed);
    // Remove off-screen blocks and increase score
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].y > height) { blocks.splice(i, 1); score++; }
    }

    // Update stars
    starSpawnTimer -= dt;
    if (starSpawnTimer <= 0) {
      spawnStar();
      starSpawnTimer = 5000; // occasional
    }
    stars.forEach(s => s.y += blockSpeed);
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (s.y > height) { stars.splice(i, 1); continue; }
      // collision with player
      if (!s.collected && rectIntersect(player, s)) {
        s.collected = true;
        player.shield = true;
        player.shieldTimer = 3000; // 3 seconds
        beep(600, 150); // shield pickup sound
        stars.splice(i, 1);
      }
    }
    // Shield timer
    if (player.shield) {
      player.shieldTimer -= dt;
      if (player.shieldTimer <= 0) player.shield = false;
    }

    // Collision with blocks
    for (const b of blocks) {
      if (rectIntersect(player, b)) {
if (player.shield) {
           // destroy block with sound
           beep(300, 120);
           const idx = blocks.indexOf(b);
           if (idx > -1) blocks.splice(idx, 1);
           player.shield = false;
         } else {
          // Game over
          alert('Game Over! Score: ' + score);
          // reset
          blocks.length = 0;
          stars.length = 0;
          score = 0;
          player.x = width / 2 - player.w / 2;
          player.shield = false;
          blockSpeed = 2;
          return;
        }
      }
    }

    // Gradually increase difficulty
    blockSpeed = 2 + score * 0.02;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#001');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Player with rounded rect and glow
    ctx.save();
    ctx.fillStyle = player.shield ? '#00ffff' : '#1e90ff';
    ctx.shadowColor = player.shield ? '#00ffff' : '#1e90ff';
    ctx.shadowBlur = 15;
    const r = 6; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.fill();
    ctx.restore();

    // Blocks with gradient and slight rotation
    ctx.save();
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;
    const blockGrad = ctx.createLinearGradient(0, 0, 0, 20);
    blockGrad.addColorStop(0, '#ff6666');
    blockGrad.addColorStop(1, '#aa0000');
    ctx.fillStyle = blockGrad;
    blocks.forEach(b => {
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate((Math.random() - 0.5) * 0.1);
      ctx.translate(-b.w / 2, -b.h / 2);
      ctx.fillRect(0, 0, b.w, b.h);
      ctx.restore();
    });
    ctx.restore();

    // Stars drawn as five‑point stars with glow
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    stars.forEach(s => {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const outer = s.w / 2;
      const inner = outer * 0.5;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 2) + i * (2 * Math.PI / 5);
        const x = cx + Math.cos(angle) * outer;
        const y = cy - Math.sin(angle) * outer;
        ctx.lineTo(x, y);
        const angleInner = angle + Math.PI / 5;
        const xi = cx + Math.cos(angleInner) * inner;
        const yi = cy - Math.sin(angleInner) * inner;
        ctx.lineTo(xi, yi);
      }
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // Score text with subtle outline
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = '16px sans-serif';
    ctx.strokeText('Score: ' + score, 10, 20);
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
