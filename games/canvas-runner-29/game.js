// Simple endless runner with improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_W = 40;
  const PLAYER_H = 60;
  const SLIDE_H = 30;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const player = {
    x: 50,
    y: H - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    jumping: false,
    sliding: false,
    update() {
      if (this.jumping) {
        this.vy += GRAVITY;
        this.y += this.vy;
        if (this.y >= H - this.h) {
          this.y = H - this.h;
          this.vy = 0;
          this.jumping = false;
        }
      }
      if (this.sliding) {
        // slide lasts a short fixed time
        this.slideTimer -= 1;
        if (this.slideTimer <= 0) {
          this.sliding = false;
          this.h = PLAYER_H;
        }
      }
    },
    jump() {
      if (!this.jumping && !this.sliding) {
        this.jumping = true;
        this.vy = JUMP_VELOCITY;
        playTone(400, 0.2);
      }
    },
    slide() {
      if (!this.jumping && !this.sliding) {
        this.sliding = true;
        this.h = SLIDE_H;
        this.slideTimer = 15; // frames
        playTone(200, 0.2);
      }
    },
    draw() {
      // draw player with rounded rectangle
      const r = 8;
      ctx.fillStyle = '#0a74da';
      ctx.beginPath();
      ctx.moveTo(this.x + r, this.y);
      ctx.lineTo(this.x + this.w - r, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + r);
      ctx.lineTo(this.x + this.w, this.y + this.h - r);
      ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - r, this.y + this.h);
      ctx.lineTo(this.x + r, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - r);
      ctx.lineTo(this.x, this.y + r);
      ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
      ctx.closePath();
      ctx.fill();
    }
  };

  const obstacles = [];
  const stars = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const height = 40 + Math.random() * 40;
    obstacles.push({ x: W, y: H - height, w: 20, h: height });
  }

  function spawnStar() {
    const size = 15;
    const y = H - PLAYER_H - 80 - Math.random() * 100;
    stars.push({ x: W, y, w: size, h: size });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 6;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
  }

  function updateStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= 6;
      if (s.x + s.w < 0) stars.splice(i, 1);
    }
  }

  function checkCollisions() {
  // Ensure audio context is running after first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
    // player vs obstacles
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
playTone(150, 0.5);
          gameOver = true;
          return;
      }
    }
    // player vs stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (player.x < s.x + s.w && player.x + player.w > s.x &&
          player.y < s.y + s.h && player.y + player.h > s.y) {
        score += 10;
        stars.splice(i, 1);
        playTone(600, 0.15); // star collect sound
      }
    }
  }

  function drawObstacles() {
    // draw obstacles with gradient and rounded corners
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#a52a2a'); // brownish
    grad.addColorStop(1, '#8b0000'); // dark red
    ctx.fillStyle = grad;
    for (const o of obstacles) {
      const r = 4;
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
    }
  }

  function drawStars() {
    ctx.fillStyle = '#ffd700';
    for (const s of stars) ctx.fillRect(s.x, s.y, s.w, s.h);
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
      return;
    }
    // Draw scrolling background
  ctx.fillStyle = ctx.createLinearGradient(0, 0, 0, H);
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#87ceeb'); // sky blue
  bgGrad.addColorStop(1, '#b0e0e6'); // light blue
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // ground
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, H - 20, W, 20);
  // optional parallax hills (simple arcs)
  ctx.fillStyle = '#3c7d4c';
  for (let i = 0; i < 5; i++) {
    const hillX = (i * 200 + (frame * 0.5) % 200) - 200;
    ctx.beginPath();
    ctx.arc(hillX, H - 20, 100, Math.PI, 0);
    ctx.fill();
  }
  // clear previous drawings of obstacles and player (draw over background)
  // Not using clearRect to preserve background
  // ctx.clearRect(0, 0, W, H);

    frame++;
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 150 === 0) spawnStar();
    player.update();
    updateObstacles();
    updateStars();
    checkCollisions();
    drawObstacles();
    drawStars();
    player.draw();
    score += 0.1; // time based increment
    drawScore();
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') player.jump();
    else if (e.code === 'ArrowDown') player.slide();
  });

  loop();
})();
