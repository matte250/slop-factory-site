// Pixel Runner - simple endless runner
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 200;

  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const SCROLL_SPEED = 3;

  const player = {
    x: 50,
    y: canvas.height - 30,
    w: 20,
    h: 20,
    vy: 0,
    onGround: true,
    draw() { ctx.save(); ctx.fillStyle = '#0ff'; // cyan base
    // inner glow
    const glowGrad = ctx.createRadialGradient(this.x+this.w/2, this.y+this.h/2, this.w/4, this.x+this.w/2, this.y+this.h/2, this.w/2);
    glowGrad.addColorStop(0, '#a0ffff');
    glowGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(this.x+this.w/2, this.y+this.h/2, this.w/2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore(); },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= canvas.height) { this.y = canvas.height - this.h; this.vy = 0; this.onGround = true; }
    },
    jump() { if (this.onGround) { this.vy = JUMP_STRENGTH; this.onGround = false; } }
  };

  const platforms = [{ x: 0, y: canvas.height - 10, w: canvas.width, h: 10 }];
  const obstacles = [];
  let frame = 0;

  function addPlatform() {
    const last = platforms[platforms.length - 1];
    const gap = 80 + Math.random() * 120;
    const width = 100 + Math.random() * 150;
    const y = canvas.height - 10 - Math.random() * 30;
    platforms.push({ x: last.x + last.w + gap, y, w: width, h: 10 });
    // occasional obstacle on platform
    if (Math.random() < 0.3) {
      obstacles.push({ x: platforms[platforms.length - 1].x + width / 2, y: y - 20, w: 20, h: 20 });
    }
  }

  function updateWorld() {
    // move platforms & obstacles left
    platforms.forEach(p => p.x -= SCROLL_SPEED);
    obstacles.forEach(o => o.x -= SCROLL_SPEED);
    // remove off‑screen
    while (platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    if (frame % 60 === 0) addPlatform();
    frame++;
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        return true;
      }
    }
    return false;
  }

  function drawBackground() {
    // sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87ceeb'); // light sky
    grad.addColorStop(1, '#1e90ff'); // deep sky
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

function drawWorld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    // draw ground platforms with slight shading
    ctx.fillStyle = '#654321';
    platforms.forEach(p => {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // subtle top highlight
      ctx.fillStyle = '#795548';
      ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = '#654321';
    });
    // draw obstacles as dark triangles
    ctx.fillStyle = '#222';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // draw player as a rounded cyan sprite with inner glow
    player.draw();
  }

  function loop() {
    player.update();
    updateWorld();
    if (checkCollision() || player.y > canvas.height) {
      // play crash sound then reset
      playCrashSound();
      player.y = canvas.height - player.h;
      player.vy = 0;
      platforms.splice(0, platforms.length, { x: 0, y: canvas.height - 10, w: canvas.width, h: 10 });
      obstacles.length = 0;
      frame = 0;
    }
    drawWorld();
    requestAnimationFrame(loop);
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playCrashSound() { playTone(100, 0.3); }

  // input
  window.addEventListener('keydown', e => { if (e.code === 'Space') { player.jump(); playJumpSound(); } });
  canvas.addEventListener('mousedown', () => { player.jump(); playJumpSound(); });

  // start game
  loop();
})();
