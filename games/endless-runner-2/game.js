// Endless Runner implementation for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.width || 800);
  const H = (canvas.height = canvas.height || 200);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone player
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJump() { playTone(440, 0.15); }
  function playCoin() { playTone(660, 0.1); }
  function playGameOver() { playTone(110, 0.5); }

  // Player (square)
  const player = {
    x: 50,
    y: H - 30,
    w: 20,
    h: 20,
    vy: 0,
    gravity: 0.6,
    jumpForce: -12,
    onGround: true,
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.h >= H) {
        this.y = H - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = this.jumpForce;
        this.onGround = false;
        playJump();
      }
    },
    draw() {
      // rounded player with gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#3f3');
      grad.addColorStop(1, '#0a0');
      ctx.fillStyle = grad;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.w - radius, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + radius);
      ctx.lineTo(this.x + this.w, this.y + this.h - radius);
      ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - radius, this.y + this.h);
      ctx.lineTo(this.x + radius, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - radius);
      ctx.lineTo(this.x, this.y + radius);
      ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
      ctx.closePath();
      ctx.fill();
    },
  };

  // Game objects
  const obstacles = [];
  const coins = [];
  const speed = 3;
  let frames = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const gapHeight = 40; // vertical gap between floor and obstacle base
    const obstHeight = 30 + Math.random() * 30; // random height
    obstacles.push({
      x: W,
      y: H - obstHeight,
      w: 20,
      h: obstHeight,
    });
  }

  function spawnCoin() {
    const coinY = H - 60 - Math.random() * 80;
    coins.push({ x: W, y: coinY, r: 5 });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectCollide(c, r) {
    const distX = Math.abs(c.x - r.x - r.w / 2);
    const distY = Math.abs(c.y - r.y - r.h / 2);
    if (distX > r.w / 2 + c.r) return false;
    if (distY > r.h / 2 + c.r) return false;
    if (distX <= r.w / 2) return true;
    if (distY <= r.h / 2) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  function update() {
    if (gameOver) return;
    frames++;
    if (frames % 100 === 0) spawnObstacle();
    if (frames % 150 === 0) spawnCoin();

    player.update();

    // move obstacles & check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (rectCollide(player, o)) {
        gameOver = true;
        playGameOver();
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // move coins & check collection
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.x -= speed;
      const dummyRect = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
      if (circleRectCollide(c, player)) {
        score += 10;
        playCoin();
        coins.splice(i, 1);
        continue;
      }
      if (c.x + c.r < 0) coins.splice(i, 1);
    }

    score += 0.01; // distance based
  }

  function draw() {
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // ground with slight shadow gradient
    const groundGrad = ctx.createLinearGradient(0, H - 20, 0, H);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#3b2310');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 20, W, 20);

    player.draw();

    // draw obstacles with gradient
    obstacles.forEach(o => {
      const obstGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obstGrad.addColorStop(0, '#b22222');
      obstGrad.addColorStop(1, '#8b0000');
      ctx.fillStyle = obstGrad;
      // rounded rectangle for obstacle
      const r = 3;
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.w - r, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + r);
      ctx.lineTo(o.x + o.w, o.y + o.h - r);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - r, o.y + o.h);
      ctx.lineTo(o.x + r, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.closePath();
      ctx.fill();
    });

    // draw coins with radial gradient (shiny)
    coins.forEach(c => {
      const radGrad = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      radGrad.addColorStop(0, '#fff');
      radGrad.addColorStop(0.5, '#ff0');
      radGrad.addColorStop(1, '#c09000');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling: click or space/arrow up
  canvas.addEventListener('pointerdown', () => player.jump());
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') player.jump();
  });

  loop();
})();
