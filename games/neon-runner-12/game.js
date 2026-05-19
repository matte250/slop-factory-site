// Neon Runner – enhanced graphics
// Target canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const jumpSound = () => playTone(440, 0.1);
  const slideSound = () => playTone(220, 0.1);
  const pointSound = () => playTone(660, 0.05);
  const gameOverSound = () => playTone(100, 0.5);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Resize to fill element and initialize stars
  const NUM_STARS = 80;
  const stars = [];
  const initStars = () => {
    stars.length = 0;
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: 0.2 + Math.random() * 0.5,
      });
    }
  };
  initStars();
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initStars();
  };
  resize();
  window.addEventListener('resize', resize);

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SPEED = 3; // world scroll speed
  const OBSTACLE_FREQ = 120; // frames between spawns

  const player = {
    x: 50,
    y: canvas.height - 40,
    w: 30,
    h: 30,
    vy: 0,
    isJumping: false,
    isSliding: false,
    update() {
      // apply gravity if in air
      if (this.y < canvas.height - this.h) {
        this.vy += GRAVITY;
        this.y += this.vy;
        if (this.y >= canvas.height - this.h) {
          this.y = canvas.height - this.h;
          this.vy = 0;
          this.isJumping = false;
        }
      }
      // slide resets after short time
      if (this.isSliding) {
        this.slideTimer--;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
          this.h = 30;
        }
      }
    },
jump() {
        if (!this.isJumping && !this.isSliding) {
          this.isJumping = true;
          this.vy = JUMP_VELOCITY;
          jumpSound();
        }
      },
slide() {
        if (!this.isJumping && !this.isSliding) {
          this.isSliding = true;
          this.h = 15; // lower hitbox
          this.y = canvas.height - this.h;
          this.slideTimer = 30; // frames
          slideSound();
        }
      },
    draw() {
      ctx.save();
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#0ff'; // neon cyan
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h / 2);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  const obstacles = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const type = Math.random() < 0.5 ? 'low' : 'high';
    const w = 20 + Math.random() * 20;
    const h = 30 + Math.random() * 30;
    if (type === 'low') {
      // obstacle on ground, player must jump
      obstacles.push({ x: canvas.width, y: canvas.height - h, w, h, type });
    } else {
      // obstacle hanging from top, player must slide
      obstacles.push({ x: canvas.width, y: 0, w, h, type });
    }
  };

  const checkCollision = (obs) => {
    const px = player.x, py = player.y, pw = player.w, ph = player.h;
    const ox = obs.x, oy = obs.y, ow = obs.w, oh = obs.h;
    return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
  };

  const loop = () => {
    if (gameOver) return;
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw and update stars
    ctx.fillStyle = '#fff';
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // clear previous frames (background already drawn)
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // update player
    player.update();
    player.draw();
    // spawn obstacles
    if (frame % OBSTACLE_FREQ === 0) spawnObstacle();
    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= PLAYER_SPEED;
      // draw with neon glow
      ctx.save();
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      ctx.fillStyle = o.type === 'low' ? '#ff0' : '#0ff';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.restore();
      // collision
      if (checkCollision(o)) {
        gameOver = true;
          gameOverSound();
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
      }
      // remove off‑screen
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    frame++;
    if (!gameOver) requestAnimationFrame(loop);
  };

  // input handling – click/tap toggles jump, right‑click or long‑press slides
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button === 2) {
      player.slide();
    } else {
      player.jump();
    }
  });
  // prevent context menu on right click
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // start
  requestAnimationFrame(loop);
})();
