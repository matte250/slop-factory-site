// Simple endless runner for <canvas id="game"></canvas>
// Improved graphics: gradients, rounded shapes, simple shading.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.width || 800;
  const H = canvas.height = canvas.height || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playTone(300, 0.12); }
  function playCoin() { playTone(600, 0.08); }
  function playLose() { playTone(150, 0.3); }

  // Helper: draw rounded rectangle
  function drawRoundedRect(x, y, w, h, r, fillStyle) {
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
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  // ----- Game objects -----
  const player = {
    w: 40,
    h: 40,
    x: 80,
    y: H - 80,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    slideHeight: 20,
    isSliding: false,
    onGround: true,
    draw() {
      // Player gradient shading
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#6AB0F3');
      grad.addColorStop(1, '#4A90E2');
      const ph = this.isSliding ? this.slideHeight : this.h;
      drawRoundedRect(this.x, this.y + (this.h - ph), this.w, ph, 8, grad);
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.h >= H - 20) { // floor at H-20
        this.y = H - 20 - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    }
  };

  const floorY = H - 20;
  const obstacles = [];
  const coins = [];
  let score = 0;
  let speed = 4;
  let frame = 0;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: W, y: floorY - size, w: size, h: size });
  }
  function spawnCoin() {
    const size = 15;
    const y = floorY - 80 - Math.random() * 60;
    coins.push({ x: W, y, r: size / 2 });
  }

  // ----- Main loop -----
  function loop() {
    // --- Update ---
    // Input handling
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (keys['Space'] && player.onGround) { player.vy = player.jumpStrength; player.onGround = false; playJump(); }
    if (keys['ArrowDown'] && player.onGround) { player.isSliding = true; } else { player.isSliding = false; }

    player.update();

    // Move obstacles & coins
    obstacles.forEach(o => o.x -= speed);
    coins.forEach(c => c.x -= speed);

    // Remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (coins.length && coins[0].x + coins[0].r < 0) coins.shift();

    // Spawn logic
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 90 === 0) spawnCoin();

    // Collision detection
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      const ph = player.isSliding ? player.slideHeight : player.h;
        if (player.x < o.x + o.w && player.x + player.w > o.x &&
            player.y + player.h - (player.isSliding ? player.h - player.slideHeight : 0) < o.y + o.h &&
            player.y + player.h > o.y) {
        // lose condition
        playLose();
        alert('Game Over! Score: ' + score);
        document.location.reload();
        return;
      }
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      const dx = (player.x + player.w / 2) - c.x;
      const dy = (player.y + player.h / 2) - c.y;
      const dist = Math.hypot(dx, dy);
        if (dist < c.r + Math.min(player.w, player.h) / 2) {
          score++;
          playCoin();
          coins.splice(i, 1);
        }
    }

    // --- Draw ---
    // background sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // floor with subtle gradient
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
    floorGrad.addColorStop(0, '#555');
    floorGrad.addColorStop(1, '#777');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, W, H - floorY);

    // player
    player.draw();

    // obstacles with rounded corners and gradient shading
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#FF5A5F');
      grad.addColorStop(1, '#D0021B');
      drawRoundedRect(o.x, o.y, o.w, o.h, 6, grad);
    });

    // coins with radial gradient for sparkle
    coins.forEach(c => {
      const radGrad = ctx.createRadialGradient(c.x, c.y, c.r * 0.3, c.x, c.y, c.r);
      radGrad.addColorStop(0, '#FFF9C4');
      radGrad.addColorStop(1, '#F5A623');
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = radGrad;
      ctx.fill();
    });

    // score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    frame++;
    speed = 4 + score * 0.1; // gradually increase difficulty
    requestAnimationFrame(loop);
  }

  // start
  loop();
})();
