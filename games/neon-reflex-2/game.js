// Simple endless‑runner based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Simple sound using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  const player = {
    width: 20,
    height: 20,
    x: canvas.width / 2 - 10,
    y: canvas.height - 30,
    speed: 5,
    color: '#0ff',
  };

  const obstacles = [];
  const particles = [];
  const obstacleSize = { w: 20, h: 20 };
  const obstacleSpeed = 2;
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  const keys = { left: false, right: false };

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Optional mouse control (move player to mouse x)
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    player.x = mx - player.width / 2;
    clampPlayer();
  });

  function clampPlayer() {
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  }

  function spawnObstacle() {
    const x = Math.random() * (canvas.width - obstacleSize.w);
    obstacles.push({ x, y: -obstacleSize.h, w: obstacleSize.w, h: obstacleSize.h });
  }

  function update(dt) {
    if (gameOver) return;
    // player movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    clampPlayer();

    // obstacles
    obstacles.forEach(o => (o.y += obstacleSpeed));
    // remove off‑screen obstacles and increase score
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].y > canvas.height) {
          obstacles.splice(i, 1);
          score++;
          beep(300, 0.08); // score increment sound
        }
    }
    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.width > o.x &&
        player.y < o.y + o.h &&
        player.y + player.height > o.y
      ) {
        beep(120, 0.3); // collision sound
        gameOver = true;
        break;
      }
    }
    // spawn new obstacles
    if (performance.now() - lastSpawn > 1000) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
    // particle effect – emit from player
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: Math.random() * 2 + 1,
        color: '#0ff',
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: 1
      });
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    // neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw particles (simple fading circles)
    particles.forEach((p, i) => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // player – neon circle with glow
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // obstacles – gradient blocks with stroke
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    // score / game‑over text
    ctx.fillStyle = '#0ff';
    ctx.font = '18px monospace';
    ctx.fillText('Score: ' + score, 10, 24);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0ff';
      ctx.textAlign = 'center';
      ctx.font = '32px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let last = 0;
  function loop(timestamp) {
    const dt = timestamp - last;
    last = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});
