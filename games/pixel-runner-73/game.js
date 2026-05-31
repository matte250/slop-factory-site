// Enhanced endless runner graphics for canvas id "game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 200;
  // player state
  const player = {x: 50, y: H - 40, w: 30, h: 30, vy: 0, onGround: true, dashTimer: 0};
  const GRAVITY = 0.6, JUMP = -12, DASH_SPEED = 8;
  // sound system
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { beep(300, 0.1); }
  function playDash() { beep(600, 0.08); }
  function playCollect() { beep(900, 0.05); }
  function playGameOver() { beep(150, 0.5); }
  // game objects
  const obstacles = [];
  const stars = [];
  let frame = 0, score = 0, lastSpace = 0;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'block';
    const w = type === 'spike' ? 20 : 30;
    const h = type === 'spike' ? 20 : 30;
    obstacles.push({x: W, y: H - h, w, h, type});
  }

  function spawnStar() {
    const size = 8;
    const x = W;
    const y = H - 30 - Math.random() * 80; // random height above ground
    stars.push({x, y, size});
  }

  // input handling (space/double space)
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    const now = performance.now();
    if (now - lastSpace < 300) { // double tap
      player.dashTimer = 15;
      playDash();
    } else if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
      playJump();
    }
    lastSpace = now;
  });

  function update() {
    frame++;
    // player physics
    if (player.dashTimer > 0) player.x += DASH_SPEED;
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // world scroll (auto move right)
    player.x += 2;

    // obstacles movement and spawn
    if (frame % 120 === 0) spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // scroll left relative to camera
      // collision
      if (o.x < player.x + player.w && o.x + o.w > player.x &&
          o.y < player.y + player.h && o.y + o.h > player.y) {
        // game over
        playGameOver();
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // stars movement and collection
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= 4;
      // collection check (simple bounding box)
      if (s.x < player.x + player.w && s.x + s.size > player.x &&
          s.y < player.y + player.h && s.y + s.size > player.y) {
        score += 5; // bonus points
        playCollect();
        stars.splice(i, 1);
        continue;
      }
      if (s.x + s.size < 0) stars.splice(i, 1);
    }
    // spawn stars periodically
    if (frame % 200 === 0) spawnStar();
    score += 0.02;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#7ec0ee'); // sky blue
    bgGrad.addColorStop(1, '#c2e1ff'); // lighter
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ground with gradient
    const groundGrad = ctx.createLinearGradient(0, H - 10, 0, H);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#333');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 10, W, 10);

    // player (rounded square, teal)
    ctx.fillStyle = '#1abc9c';
    drawRoundedRect(player.x, player.y, player.w, player.h, 5);

    // obstacles: spikes as triangles, blocks as rectangles
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    });

    // stars (collectibles) as small yellow stars
    stars.forEach(s => {
      ctx.fillStyle = '#f1c40f';
      drawStar(s.x, s.y, 5, 6, 3);
    });

    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  // helper to draw rounded rectangle
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

  // helper to draw a star shape
  function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
