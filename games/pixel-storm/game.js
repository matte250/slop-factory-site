// Enhanced Pixel Storm game with improved graphics and sound effects
// Requires a <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ==== Audio setup ==== //
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.08) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration * 1000);
  }
  function playShoot() { playTone(800, 'square', 0.06); }
  function playExplosion() { playTone(200, 'triangle', 0.2); }
  function playGameOver() { playTone(100, 'sawtooth', 0.5); }

  // ==== Game state ==== //
  const ship = { x: width / 2, y: height - 25, w: 30, h: 20, speed: 5 };
  const bullets = [];
  const blocks = [];
  const stars = [];
  const particles = [];
  let score = 0;
  let gameOver = false;
  let blockSpawnTimer = 0;
  let blockSpawnInterval = 90; // frames
  let blockSpeed = 1.5;

  // ==== Input handling ==== //
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ==== Helpers ==== //
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function drawRoundedRect(x, y, w, h, r) {
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

  function spawnStar() {
    stars.push({ x: rand(0, width), y: 0, size: rand(0.5, 1.5), speed: rand(0.2, 0.6) });
  }

  function updateStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) stars.splice(i, 1);
    }
    while (stars.length < 100) spawnStar();
  }

  function spawnParticle(x, y, color) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        x,
        y,
        vx: rand(-1, 1),
        vy: rand(-1, -3),
        life: rand(20, 40),
        color,
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function spawnBlock() {
    const size = 20;
    const x = Math.random() * (width - size);
    const hue = Math.floor(rand(0, 360));
    blocks.push({ x, y: -size, w: size, h: size, hue });
  }

  // ==== Game loop ==== //
  function update() {
    // ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // shooting
    if (keys['Space'] && (ship.canShoot === undefined || ship.canShoot)) {
      bullets.push({ x: ship.x + ship.w / 2, y: ship.y, r: 3, speed: 6 });
      ship.canShoot = false;
      playShoot();
      setTimeout(() => ship.canShoot = true, 200);
    }

    // bullets update
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.r < 0) bullets.splice(i, 1);
    }

    // spawn blocks
    if (blockSpawnTimer <= 0) {
      spawnBlock();
      blockSpawnTimer = blockSpawnInterval;
      if (blockSpawnInterval > 30) blockSpawnInterval -= 0.5;
      blockSpeed += 0.01;
    } else {
      blockSpawnTimer--;
    }

    // blocks update and collisions
    for (let i = blocks.length - 1; i >= 0; i--) {
      const blk = blocks[i];
      blk.y += blockSpeed;
      // lose condition
      if (blk.y + blk.h >= ship.y) {
        gameOver = true;
        playGameOver();
        return;
      }
      // bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.x > blk.x && b.x < blk.x + blk.w && b.y > blk.y && b.y < blk.y + blk.h) {
          bullets.splice(j, 1);
          blocks.splice(i, 1);
          score++;
          spawnParticle(b.x, b.y, `hsl(${blk.hue},80%,60%)`);
          playExplosion();
          break;
        }
      }
    }

    // stars and particles update
    updateStars();
    updateParticles();
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001020');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

    // draw ship as triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // draw bullets as circles
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw blocks with rounded corners and hue color
    blocks.forEach(blk => {
      ctx.fillStyle = `hsl(${blk.hue},70%,50%)`;
      drawRoundedRect(blk.x, blk.y, blk.w, blk.h, 4);
    });

    // draw particles (fading squares)
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life / 40, 0);
      ctx.fillRect(p.x, p.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    // score UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '16px monospace';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // initialise
  ship.canShoot = true;
  while (stars.length < 100) spawnStar();
  loop();
})();
