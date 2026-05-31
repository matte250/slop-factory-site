// Simple endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 200;
  const ground = H - 30;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let musicStarted = false;
  function playSound(frequency, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playSound(300, 0.1); }
  function playCrash() { playSound(80, 0.3); }
  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    // loop via periodic restart
    setInterval(() => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(120, audioCtx.currentTime);
      g.gain.setValueAtTime(0.02, audioCtx.currentTime);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.5);
    }, 500);
  }

  const player = { x: 50, y: ground, w: 20, h: 30, vy: 0, gravity: 0.6, jumpForce: -12 };
  function jump() { if (player.y >= ground) { player.vy = player.jumpForce; playJump(); } }

  const obstacles = [];
  const clouds = [];
  let spawnTimer = 0;
  let cloudTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({ x: W, y: ground - size, w: size, h: size });
  }

  function spawnCloud() {
    const r = 15 + Math.random() * 10;
    const y = 20 + Math.random() * (ground - 80);
    clouds.push({ x: W, y, r, speed: 2 + Math.random() * 1 });
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > ground) { player.y = ground; player.vy = 0; }
    // obstacles
    spawnTimer++;
    if (spawnTimer > spawnInterval) { spawnObstacle(); spawnTimer = 0; }
    // clouds
    cloudTimer++;
    if (cloudTimer > 150) { spawnCloud(); cloudTimer = 0; }
    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5;
      // collision
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        playCrash();
        gameOver = true;
      }
      // remove off-screen
      if (o.x + o.w < 0) { obstacles.splice(i, 1); score++; }
    }
    // update clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.r < 0) clouds.splice(i, 1);
    }
    score++;
  }

  function draw() {
    // sky
    const skyGrad = ctx.createLinearGradient(0, 0, W, 0);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#b0e0e6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, ground);
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ground
    const groundGrad = ctx.createLinearGradient(0, ground, 0, H);
    groundGrad.addColorStop(0, '#855E42');
    groundGrad.addColorStop(1, '#45322B');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, ground, W, H - ground);
    // player body
    const bodyGrad = ctx.createLinearGradient(0, player.y - player.h, 0, player.y);
    bodyGrad.addColorStop(0, '#ff0');
    bodyGrad.addColorStop(1, '#ffcc00');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(player.x, player.y - player.h, player.w, player.h);
    // player head
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y - player.h - player.w / 4, player.w / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0';
    ctx.fill();
    // obstacles
    ctx.fillStyle = '#c33';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y - o.h, o.w, o.h));
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over - Press Space to Restart', W/2, H/2);
      ctx.textAlign = 'start';
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // input
window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        if (!musicStarted) startMusic();
        if (gameOver) {
          obstacles.length = 0;
          clouds.length = 0;
          score = 0;
          gameOver = false;
        } else {
          jump();
        }
    }
  });
  window.addEventListener('mousedown', () => { if (!musicStarted) startMusic(); if (!gameOver) jump(); });

  loop();
})();
