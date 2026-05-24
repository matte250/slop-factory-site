// Pixel Dash – simple endless runner
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 400);

  const floorHeight = 30;

  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  function playJumpSound() { playTone(300, 120); }
  function playCollisionSound() { playTone(100, 300); }

  // ----- stars for background -----
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.6,
      size: Math.random() * 2 + 0.5,
      speed: 0.2 + Math.random() * 0.3,
    });
  }

  // ----- particles for jump effect -----
  const particles = [];
  function spawnParticle(x, y) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 2 - 1,
      life: 30,
      size: Math.random() * 2 + 1,
    });
  }
  const playerSize = 20;
  const gravity = 0.6;
  const jumpBase = -12;
  const speedInc = 0.0005; // per frame

  let speed = 3;
  let score = 0;
  let gameOver = false;
  let keys = {};

  const player = {
    x: 50,
    y: H - floorHeight - playerSize,
    w: playerSize,
    h: playerSize,
    vy: 0,
    onGround() { return this.y + this.h >= H - floorHeight; },
    reset() { this.x = 50; this.y = H - floorHeight - playerSize; this.vy = 0; },
  };

  const obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames

  // Input – click or tap triggers jump
  const startJump = (e) => {
    if (gameOver) return restart();
    if (player.onGround()) {
      player.vy = jumpBase;
      // spawn a burst of particles on jump
      for (let i = 0; i < 8; i++) spawnParticle(player.x + player.w / 2, player.y + player.h / 2);
      playJumpSound();
    }
    e.preventDefault();
  };
  canvas.addEventListener('mousedown', startJump);
  canvas.addEventListener('touchstart', startJump);

  function restart() {
    gameOver = false;
    score = 0;
    speed = 3;
    player.reset();
    obstacles.length = 0;
    spawnTimer = 0;
    loop();
  }

  function spawnObstacle() {
    const width = 20 + Math.random() * 30; // 20‑50px
    const height = 20 + Math.random() * 60; // 20‑80px
    const hue = Math.random() * 30; // subtle red hue
    obstacles.push({ x: W, w: width, h: height, y: H - floorHeight - height, hue });
  }

  function update() {
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h > H - floorHeight) {
      player.y = H - floorHeight - player.h;
      player.vy = 0;
    }

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // star movement (parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H * 0.6;
      }
    }

    // particles update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // spawn logic
    if (spawnTimer++ >= spawnInterval) {
      spawnObstacle();
      spawnTimer = 0;
    }

    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playCollisionSound();
        gameOver = true;
        break;
      }
    }

    // difficulty increase
    speed += speedInc;
    score++;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient (sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // floor with gradient shading
    const floorGrad = ctx.createLinearGradient(0, H - floorHeight, 0, H);
    floorGrad.addColorStop(0, '#777');
    floorGrad.addColorStop(1, '#444');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, H - floorHeight, W, floorHeight);

    // player – circle with radial gradient for depth
    const pGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 8,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    pGrad.addColorStop(0, '#A0FFA0');
    pGrad.addColorStop(1, '#00AA00');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // obstacles – colored rectangles with stored hue shading
    for (const o of obstacles) {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      const hue = o.hue !== undefined ? o.hue : Math.random() * 30;
      obsGrad.addColorStop(0, `hsl(${hue}, 80%, 70%)`);
      obsGrad.addColorStop(1, `hsl(${hue}, 80%, 40%)`);
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over – Click to Restart', W / 2, H / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // start the game loop
  loop();
})();
