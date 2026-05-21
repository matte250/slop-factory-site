// Simple Neon Runner game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  const W = (canvas.width = 800);
  const H = (canvas.height = 200);

  // player
  const player = {
    x: 50,
    y: H - 30,
    w: 20,
    h: 20,
    vy: 0,
    jumpForce: -8,
    gravity: 0.4,
    onGround: true,
    color: '#0ff',
  };

  // obstacles array
  const obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let gameOver = false;
  let score = 0;

  // handle input
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpForce;
      player.onGround = false;
      // resume audio context if needed and play jump sound
      audioCtx.resume().then(() => playTone(400, 100));
    }
  };
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });

  function spawnObstacle() {
    const gap = Math.random() * 40 + 20;
    const w = Math.random() * 30 + 20;
    obstacles.push({ x: W + gap, y: H - 30, w, h: 30, passed: false, color: '#f0f' });
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > H - player.h) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      // collision
        if (
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y
        ) {
          gameOver = true;
          audioCtx.resume().then(() => playTone(200, 300)); // collision sound
        }
      // score when passed
      if (!o.passed && o.x + o.w < player.x) {
        o.passed = true;
        score++;
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn logic
    if (spawnTimer-- <= 0) {
      spawnObstacle();
      spawnTimer = spawnInterval;
    }
  }

  function draw() {
    // clear with dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // neon ground line
    ctx.fillStyle = '#0ff';
    ctx.fillRect(0, H - 10, W, 4);
    // subtle stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * (H - 30);
      ctx.fillRect(sx, sy, 1, 1);
    }
    // player
    // neon player with glow
    const grad = ctx.createRadialGradient(
        player.x + player.w/2,
        player.y + player.h/2,
        player.w/4,
        player.x + player.w/2,
        player.y + player.h/2,
        player.w
    );
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;
    // obstacles
    obstacles.forEach((o) => {
      // neon obstacle with glow
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#400');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.shadowBlur = 0;
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
