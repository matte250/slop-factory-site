// Simple endless side‑scroll runner for canvas#game
// Player runs automatically; click/tap to jump.
// Collect stars for score, avoid obstacles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.width || 800;
  const H = canvas.height = canvas.height || 200;

  // Game state
  let running = true;
  let score = 0;
  const gravity = 0.6;
  const jumpStrength = -12;
  const speed = 4; // world scroll speed

  // Player (fixed x, variable y)
  const player = {
    x: 50,
    y: H - 30,
    w: 20,
    h: 30,
    vy: 0,
    onGround: true,
    draw() {
      // pixel‑art character: body
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // head
      ctx.fillStyle = '#0a0';
      ctx.fillRect(this.x, this.y - this.h / 2, this.w, this.h / 2);
      // eye
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + this.w / 2 - 2, this.y - this.h / 2 + 4, 2, 2);
    },
    update() {
      this.vy += gravity;
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
        this.vy = jumpStrength;
        this.onGround = false;
        playJumpSound();
      }
    }
  };

  // Obstacles and stars move left with world speed
  const obstacles = [];
  const stars = [];
  let frames = 0;

  function spawnObstacle() {
    const h = 30 + Math.random() * 30;
    obstacles.push({x: W, y: H - h, w: 20, h});
  }
  function spawnStar() {
    const size = 12;
    const y = H - 80 - Math.random() * 60;
    stars.push({x: W, y, w: size, h: size});
  }

  function updateWorld() {
    frames++;
    if (frames % 120 === 0) spawnObstacle(); // every 2 sec at 60fps
    if (frames % 180 === 0) spawnStar();
    obstacles.forEach(ob => ob.x -= speed);
    stars.forEach(st => st.x -= speed);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].w < 0) stars.shift();
  }

  function checkCollisions() {
    // obstacles
    for (const ob of obstacles) {
      if (player.x < ob.x + ob.w && player.x + player.w > ob.x &&
          player.y < ob.y + ob.h && player.y + player.h > ob.y) {
        running = false; // game over
      }
    }
    // stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const st = stars[i];
if (player.x < st.x + st.w && player.x + player.w > st.x &&
           player.y < st.y + st.h && player.y + player.h > st.y) {
        score += 10;
        stars.splice(i, 1);
        playStarSound();
      }
    }
  }

  function drawWorld() {
  // clear previous frame
  ctx.clearRect(0, 0, W, H);
  // sky gradient background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#87ceeb'); // light sky
  skyGrad.addColorStop(1, '#4682b4'); // deep sky
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);
  // ground with simple texture
  ctx.fillStyle = '#555';
  ctx.fillRect(0, H - 5, W, 5);
  // player
  player.draw();
  // obstacles as triangles (spikes)
  ctx.fillStyle = '#f00';
  obstacles.forEach(ob => {
    ctx.beginPath();
    ctx.moveTo(ob.x, ob.y + ob.h);
    ctx.lineTo(ob.x + ob.w / 2, ob.y);
    ctx.lineTo(ob.x + ob.w, ob.y + ob.h);
    ctx.closePath();
    ctx.fill();
  });
  // stars as 5‑point shapes
  ctx.fillStyle = '#ff0';
  stars.forEach(st => {
    const cx = st.x + st.w / 2;
    const cy = st.y + st.h / 2;
    const r = st.w / 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI / 2) + i * (Math.PI * 2 / 5);
      const x = cx + Math.cos(angle) * r;
      const y = cy - Math.sin(angle) * r;
      ctx.lineTo(x, y);
      const innerAngle = angle + Math.PI / 5;
      const ix = cx + Math.cos(innerAngle) * (r * 0.5);
      const iy = cy - Math.sin(innerAngle) * (r * 0.5);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
  });
  // score overlay
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
}

  function loop() {
    if (!running) {
      // play game over sound once
      if (audioCtx.state !== 'suspended') playGameOverSound();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W/2-60, H/2);
      ctx.font = '16px sans-serif';
      ctx.fillText('Score: ' + score, W/2-45, H/2+30);
      return;
    }
    player.update();
    updateWorld();
    checkCollisions();
    drawWorld();
    requestAnimationFrame(loop);
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(200, 0.1); }
  function playStarSound() { playTone(600, 0.08); }
  function playGameOverSound() { playTone(100, 0.5); }

  // input
  canvas.addEventListener('click', () => player.jump());
  canvas.addEventListener('touchstart', e => { e.preventDefault(); player.jump(); });

  // start
  loop();
})();
