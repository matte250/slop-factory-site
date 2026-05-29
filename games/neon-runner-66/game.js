// Neon Runner – minimal endless runner
// Assumes a <canvas id="game"></canvas> exists in the page.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;

  // Player definition
  // Helper to draw rounded rectangles with neon glow
  function drawRoundedRect(x, y, w, h, r, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.shadowColor = fillStyle;
    ctx.shadowBlur = 12;
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
    ctx.fill();
    ctx.restore();
  }

  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: H - 30,
    vy: 0,
    onGround: true,
    slideTimer: 0,
    color: '#0ff', // neon cyan
    get height() { return this.slideTimer > 0 ? this.h / 2 : this.h; },
    draw() {
        // draw neon rounded rectangle for the player
        drawRoundedRect(this.x, this.y - this.height, this.w, this.height, 6, this.color);
      }
  };

  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const SLIDE_DURATION = 20; // frames
  const OBSTACLE_SPEED = 6;
  const obstacles = [];
  let frame = 0;
  let score = 0;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'bar' : 'spike';
    const w = 20 + Math.random() * 30;
    const h = type === 'bar' ? 40 : 30;
    const o = {
      x: W + w,
      y: H,
      w,
      h,
      type,
      draw() {
        // neon rounded rectangle for obstacles
        const fill = type === 'bar' ? '#f0f' : '#ff0';
        drawRoundedRect(this.x, this.y - this.h, this.w, this.h, 4, fill);
      }
    };
    obstacles.push(o);
  }

  function update() {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > H) { // ground
      player.y = H;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    if (player.slideTimer > 0) player.slideTimer--;

    // obstacles movement & cleanup
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn new obstacles periodically
    if (frame % 80 === 0) spawnObstacle();

    // collision detection (AABB)
    for (const o of obstacles) {
      const px = player.x, pw = player.w, py = player.y - player.height, ph = player.height;
      const ox = o.x, ow = o.w, oy = o.y - o.h, oh = o.h;
      if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
        // game over – stop loop
        cancelAnimationFrame(rAF);
        // play game over tone
        playTone(80, 0.5);
        ctx.fillStyle = '#f00';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', W / 2 - 80, H / 2);
        return;
      }
    }

    // draw background with neon gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#001');
    gradient.addColorStop(1, '#003');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    // draw moving neon grid lines for depth
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const y = (i * 30 + frame * 2) % H;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    player.draw();
    obstacles.forEach(o => o.draw());
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    score += 0.1;
    frame++;
    rAF = requestAnimationFrame(update);
  }

  // input handling
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowUp' && player.onGround) {
      player.vy = JUMP_SPEED;
      playTone(440, 0.1); // jump sound
    }
    if (e.code === 'ArrowDown' && player.onGround && player.slideTimer === 0) {
      player.slideTimer = SLIDE_DURATION;
      playTone(220, 0.1); // slide sound
    }
  });

  let rAF = requestAnimationFrame(update);
})();
