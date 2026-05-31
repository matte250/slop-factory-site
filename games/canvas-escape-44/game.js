// Minimal side‑scroll runner based on IDEA.md
// Canvas element with id="game" must exist in the page.

(() => {
  
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(200, 0.1); }
  function playCoinSound() { playTone(400, 0.07); }
  function playGameOverSound() { playTone(100, 0.3); }
  // resume audio on first interaction
  window.addEventListener('keydown', () => { if (audioCtx.state !== 'running') audioCtx.resume(); }, { once: true });
  // --- Graphics Enhancements ---
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#87CEEB'); // sky blue
  skyGrad.addColorStop(1, '#B0E0E6'); // light teal

  class Cloud {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H * 0.3;
      this.r = 20 + Math.random() * 15;
      this.speed = 0.5 + Math.random() * 0.5;
    }
    update() {
      this.x -= this.speed;
      if (this.x + this.r < 0) {
        this.x = W + this.r;
        this.y = Math.random() * H * 0.3;
      }
    }
    draw() {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(this.x + this.r * 0.6, this.y - this.r * 0.6, this.r * 0.8, Math.PI * 1.0, Math.PI * 1.85);
      ctx.arc(this.x + this.r * 1.2, this.y, this.r, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  const clouds = [new Cloud(), new Cloud(), new Cloud()];

  const particles = [];
  function spawnParticle(x, y, color) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2 - 1, life: 30, color });
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Game parameters
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPEED = 4; // world scroll speed (pixels per frame)
  const OBSTACLE_FREQ = 1500; // ms
  const COIN_FREQ = 1000; // ms

  let lastObs = 0, lastCoin = 0, score = 0, gameOver = false;

  const player = {
    x: 50,
    y: H - 40,
    w: 30,
    h: 30,
    vy: 0,
    onGround: true,
    draw() {
      ctx.fillStyle = '#0a0';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    update() {
      this.vy += GRAVITY;
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
        this.vy = JUMP_VELOCITY;
        spawnParticle(this.x + this.w / 2, this.y + this.h / 2, '#0a0');
        playJumpSound();
      }
    }
  };

  const obstacles = [];
  const coins = [];

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: W, y: H - size, w: size, h: size, passed: false });
  }

  function spawnCoin() {
    const radius = 8;
    const y = H - 80 - Math.random() * 60;
    coins.push({ x: W, y, r: radius, collected: false });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectIntersect(c, r) {
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

function update(dt) {
  // update clouds
  clouds.forEach(cloud => cloud.update());
  // update particles
  updateParticles();
  if (gameOver) return;

  // spawn obstacles and coins
  if (dt - lastObs > OBSTACLE_FREQ) { spawnObstacle(); lastObs = dt; }
  if (dt - lastCoin > COIN_FREQ) { spawnCoin(); lastCoin = dt; }

  // move world left
  obstacles.forEach(o => o.x -= SPEED);
  coins.forEach(c => c.x -= SPEED);

  // update player
  player.update();

  // collision detection
  for (const o of obstacles) {
    if (!o.passed && o.x + o.w < player.x) { o.passed = true; score += 10; }
    if (rectIntersect(player, o)) { playGameOverSound(); gameOver = true; }
  }
  for (const c of coins) {
    if (!c.collected && circleRectIntersect(c, player)) {
      c.collected = true;
      score += 5;
      spawnParticle(c.x, c.y, '#ff0');
      playCoinSound();
    }
  }

  // clean up off‑screen objects
  while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
  while (coins.length && coins[0].x + coins[0].r < 0) coins.shift();
}

  function draw() {
  // background sky
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);
    // clouds
    clouds.forEach(c => c.draw());

    // ground line
    ctx.fillStyle = '#555';
    ctx.fillRect(0, H - 2, W, 2);

    player.draw();
    ctx.fillStyle = '#a00';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    ctx.fillStyle = '#ff0';
    coins.forEach(c => {
      if (!c.collected) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
    }
  }

  function loop(timestamp) {
    update(timestamp);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (gameOver) {
        // restart
        obstacles.length = 0; coins.length = 0; score = 0; gameOver = false; player.y = H - player.h; player.vy = 0; lastObs = lastCoin = performance.now();
        requestAnimationFrame(loop);
      } else {
        player.jump();
      }
    }
  });

  // start game
  requestAnimationFrame(loop);
})();
