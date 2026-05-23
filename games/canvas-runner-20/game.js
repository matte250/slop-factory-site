// Game: Canvas Runner – simple endless side‑scroll runner
// Canvas element with id="game" is assumed to exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 200);
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function ensureAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // ---------- Game constants ----------
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const SLIDE_TIME = 300; // ms
  const OBSTACLE_FREQ = 1500; // ms
  const COIN_FREQ = 2000; // ms
  const SCROLL_SPEED = 4;

  // ---------- Player ----------
  const player = {
    x: 50,
    y: H - 40,
    w: 30,
    h: 40,
    vy: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    draw() {
      // player as gradient rectangle (green)
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#4caf50');
      grad.addColorStop(1, '#2e7d32');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    update(dt) {
      // apply gravity
      this.vy += GRAVITY;
      this.y += this.vy;
      // ground collision
      if (this.y + this.h >= H) {
        this.y = H - this.h;
        this.vy = 0;
        this.isJumping = false;
      }
      // slide timer
      if (this.isSliding) {
        this.slideTimer -= dt;
        if (this.slideTimer <= 0) this.endSlide();
      }
    },
    jump() {
      // ensure audio context is running
      ensureAudio();
      playTone(400, 100); // jump sound
      if (this.isJumping || this.isSliding) return;
      this.vy = JUMP_SPEED;
      this.isJumping = true;
    },
    slide() {
      // slide sound
      ensureAudio();
      playTone(200, 150);
      if (this.isJumping || this.isSliding) return;
      this.isSliding = true;
      this.slideTimer = SLIDE_TIME;
      this.h = 20; // reduce height
      this.y = H - this.h; // stay on ground
    },
    endSlide() {
      this.isSliding = false;
      this.h = 40;
      this.y = H - this.h;
    },
  };

  // ---------- Entities ----------
  class Obstacle {
    constructor() {
      this.w = 20 + Math.random() * 30;
      this.h = 20 + Math.random() * 30;
      this.x = W;
      this.y = H - this.h;
    }
    update(dt) { this.x -= SCROLL_SPEED; }
    draw() {
      // obstacle with gradient brown
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#8B4513');
      grad.addColorStop(1, '#5D3311');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    offScreen() { return this.x + this.w < 0; }
  }

  class Coin {
    constructor() {
      this.r = 8;
      this.x = W;
      this.y = H - player.h - 60 - Math.random() * 40;
    }
    update(dt) { this.x -= SCROLL_SPEED; }
    draw() {
      // coin with radial gradient
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#fff200');
      grad.addColorStop(0.7, '#ffd700');
      grad.addColorStop(1, '#ffb400');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() { return this.x + this.r < 0; }
  }

  const obstacles = [];
  const coins = [];
  let lastObstacle = 0;
  let lastCoin = 0;
  let score = 0;
  let gameOver = false;
  let lastTime = 0;

  // ---------- Input ----------
  const onInput = (e) => {
    if (gameOver) return reset();
    if (e.type === 'keydown' && e.code !== 'Space') return; // ignore other keys
    // tap/click or space -> jump, hold -> slide
    if (e.type === 'keydown') {
      player.jump();
    } else if (e.type === 'mousedown' || e.type === 'touchstart') {
      player.slide();
    }
  };
  window.addEventListener('keydown', onInput);
  window.addEventListener('mousedown', onInput);
  window.addEventListener('touchstart', onInput);

  // ---------- Game loop ----------
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) {
      drawGameOver();
      return;
    }
    // spawn obstacles
    if (timestamp - lastObstacle > OBSTACLE_FREQ) {
      obstacles.push(new Obstacle());
      lastObstacle = timestamp;
    }
    // spawn coins
    if (timestamp - lastCoin > COIN_FREQ) {
      coins.push(new Coin());
      lastCoin = timestamp;
    }
    // update entities
    player.update(dt);
    obstacles.forEach(o => o.update(dt));
    coins.forEach(c => c.update(dt));
    // collision detection
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
        if (rectIntersect(player, o)) {
          // game over sound
          ensureAudio();
          playTone(150, 300);
          gameOver = true;
        }
      if (o.offScreen()) obstacles.splice(i, 1);
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (circleRectIntersect(c, player)) {
        score += 10;
        coins.splice(i, 1);
      } else if (c.offScreen()) {
        coins.splice(i, 1);
      }
    }
    // render
    // clear previous frame
    ctx.clearRect(0, 0, W, H);
    // background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - 20, W, 20);
    // draw entities
    player.draw();
    obstacles.forEach(o => o.draw());
    coins.forEach(c => c.draw());
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    requestAnimationFrame(loop);
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

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2 - 10);
    ctx.fillText('Score: ' + score, W / 2, H / 2 + 20);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press any key / click to restart', W / 2, H / 2 + 50);
  }

  function reset() {
    obstacles.length = 0;
    coins.length = 0;
    score = 0;
    gameOver = false;
    player.x = 50;
    player.y = H - 40;
    player.vy = 0;
    player.isJumping = false;
    player.isSliding = false;
    lastTime = 0;
    requestAnimationFrame(loop);
  }

  // start the loop
  requestAnimationFrame(loop);
})();
