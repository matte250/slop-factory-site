// Simple endless side‑scroller based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  // --- Graphics enhancements ---
  // Background gradient and simple clouds for parallax effect
  const clouds = [];
  const CLOUD_COUNT = 5;
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.3,
      r: 20 + Math.random() * 30,
      speed: 0.5 + Math.random() * 0.5,
    });
  }

  function drawBackground() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#87ceeb'); // light blue top
    grad.addColorStop(1, '#b0e0e6'); // lighter near horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      // move cloud left for parallax
      c.x -= c.speed;
      if (c.x + c.r < 0) c.x = WIDTH + c.r;
    }
  }

  // End of graphics enhancements

  const canvas = document.getElementById('game');
  // Audio setup
  let audioCtx = null;
  function initAudio(){
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playTone(freq, duration){
    if (!audioCtx) return;
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
  // const canvas = document.getElementById('game'); // duplicate removed
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth;
  const HEIGHT = canvas.height = canvas.offsetHeight;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPEED = 3;

  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: HEIGHT - 80,
    vy: 0,
    onGround: true,
    draw() {
      // Player gradient rectangle with rounded corners
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0af');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      const radius = 5;
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
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= groundY) {
        this.y = groundY - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      // Ensure audio context is ready
      initAudio();
      // Play jump sound
      playTone(660, 0.08);
      if (this.onGround) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
      }
    },
  };

  const groundY = HEIGHT - 50;
  const obstacles = [];
  let frame = 0;
  let gameOver = false;

  function spawnObstacle() {
    // Randomly spawn a spike or a gap (gap represented by a longer floor skip)
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    const x = WIDTH + 20;
    if (type === 'spike') {
      obstacles.push({ type: 'spike', x, y: groundY - 20, w: 20, h: 20 });
    } else {
      // gap: just push a marker; when player reaches it, floor disappears for a short span
      obstacles.push({ type: 'gap', x, width: 80, passed: false });
    }
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SPEED;
      // Remove off‑screen
      if (o.x + (o.w || o.width) < -20) obstacles.splice(i, 1);
    }
    // Spawn new obstacles every 120 frames
    if (frame % 120 === 0) spawnObstacle();
  }

  function drawFloor() {
    ctx.fillStyle = '#555';
    // Determine if a gap covers current floor segment
    let gapActive = false;
    for (const o of obstacles) {
      if (o.type === 'gap' && o.x < WIDTH && o.x + o.width > 0) {
        // Draw floor before gap
        ctx.fillRect(0, groundY, o.x, 10);
        // Skip drawing over gap, then draw remainder after gap
        ctx.fillRect(o.x + o.width, groundY, WIDTH - (o.x + o.width), 10);
        gapActive = true;
        break;
      }
    }
    if (!gapActive) ctx.fillRect(0, groundY, WIDTH, 10);
  }

  function drawObstacles() {
    ctx.fillStyle = '#a00';
    for (const o of obstacles) {
      if (o.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (o.type === 'spike') {
        const hit =
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y;
        if (hit) return true;
      }
      if (o.type === 'gap') {
        // Gap collision handled by floor missing; if player is falling below ground while over gap
        const overGap = player.x + player.w > o.x && player.x < o.x + o.width;
        if (overGap && player.y + player.h >= groundY) {
          // Player is on missing floor
          return true;
        }
      }
    }
    return false;
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 60, HEIGHT / 2);
      return;
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    drawFloor();
    player.update();
    player.draw();
    updateObstacles();
    drawObstacles();
    const collided = checkCollision();
    if (collided) {
      // Ensure audio context
      initAudio();
      // Play collision sound
      playTone(200, 0.2);
      gameOver = true;
    }
    frame++;
    requestAnimationFrame(loop);
  }

  // Input
  window.addEventListener('click', () => player.jump());
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') player.jump(); });

  // Start
  loop();
})();
