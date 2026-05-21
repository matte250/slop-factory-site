// Minimal endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // player
  const player = { x: 50, y: H - 30, size: 20, vy: 0, jumpPower: -8, onGround: true };
  const GRAVITY = 0.4;

  // obstacles
  const obstacles = [];
  const OBSTACLE_INTERVAL = 1500; // ms
  let lastObs = 0;

  // score
  let score = 0;
  let startTime = performance.now();

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playGameOverSound() { playTone(150, 0.3); }

  // input
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpPower;
      player.onGround = false;
      playJumpSound();
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.key === ' ') jump(); });
  canvas.addEventListener('click', jump);

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({ x: W, y: H - size, w: size, h: size, speed: 3 });
  }

  function update(dt) {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.size >= H) {
      player.y = H - player.size;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles movement
    obstacles.forEach(o => o.x -= o.speed);
    // remove passed obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // spawn new obstacles
    if (performance.now() - lastObs > OBSTACLE_INTERVAL) {
      spawnObstacle();
      lastObs = performance.now();
    }

    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.size > o.x &&
          player.y < o.y + o.h && player.y + player.size > o.y) {
        // lose condition – stop the loop
        cancelAnimationFrame(animId);
        playGameOverSound();
        setTimeout(() => {
          alert('Game Over! Score: ' + score);
        }, 300);
        return false;
      }
    }
    // update score
    score = Math.floor((performance.now() - startTime) / 100);
    return true;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#222');
    grd.addColorStop(1, '#000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    // scrolling ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 10);
    ctx.lineTo(W, H - 10);
    ctx.stroke();
    // simple parallax stars
    ctx.fillStyle = '#888';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 50 - bgOffset) % W;
      ctx.fillRect(sx, 20 + (i % 5) * 10, 2, 2);
    }
    // player with slight shadow
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x + 2, player.y + 2, player.size, player.size);
    ctx.fillStyle = '#0b0';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // obstacles with gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (update(dt)) {
      draw();
      animId = requestAnimationFrame(loop);
    }
  }
  animId = requestAnimationFrame(loop);
})();
