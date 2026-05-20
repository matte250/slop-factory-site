// Simple Dodge‑Shift game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // silently abort if canvas missing
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(frequency, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollisionSound() { playBeep(150, 0.3); }
  function playMoveSound() { playBeep(300, 0.05); }

  const playerSize = 20;
  const player = { x: width / 2 - playerSize / 2, y: height - playerSize - 10, w: playerSize, h: playerSize, color: '#0f0' };

  let obstacles = [];
  let particles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 1000; // ms
  let speed = 2; // pixels per frame
  let score = 0;
  let lastTime = performance.now();

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, w: size, h: size, color: '#f00' });
  }

  function update(dt) {
    // increase speed gradually
    speed += dt * 0.0005;
    // spawn obstacles based on time
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    // move obstacles down
    obstacles.forEach(o => o.y += speed);
    // generate simple star particles
    // add a few particles each frame for a star‑field effect
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: Math.random() * width,
        y: 0,
        radius: 1 + Math.random() * 1.5,
        alpha: 1,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
    // update particles
    particles.forEach(p => {
      p.y += p.speed;
      p.alpha -= 0.015;
    });
    // remove dead particles
    particles = particles.filter(p => p.y < height && p.alpha > 0);
    // remove off‑screen obstacles and increase score
    obstacles = obstacles.filter(o => {
      if (o.y > height) { score++; return false; }
      return true;
    });
    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // game over – stop animation loop
        cancelAnimationFrame(animId);
        alert('Game Over! Score: ' + score);
        return false;
      }
    }
    return true;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // particles (simple fading circles)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // player with rounded rectangle and shadow
    ctx.save();
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 10;
    ctx.fillStyle = player.color;
    const r = 4; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.fill();
    ctx.restore();

    // obstacles with rounded corners and gradient
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#800');
      grad.addColorStop(1, '#f44');
      ctx.fillStyle = grad;
      const rad = Math.min(8, o.w / 4);
      ctx.beginPath();
      ctx.moveTo(o.x + rad, o.y);
      ctx.lineTo(o.x + o.w - rad, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + rad);
      ctx.lineTo(o.x + o.w, o.y + o.h - rad);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - rad, o.y + o.h);
      ctx.lineTo(o.x + rad, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - rad);
      ctx.lineTo(o.x, o.y + rad);
      ctx.quadraticCurveTo(o.x, o.y, o.x + rad, o.y);
      ctx.fill();
    }

    // score text with glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.restore();
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!update(dt)) return; // stop if game over
    draw();
    animId = requestAnimationFrame(loop);
  }

  // input – left/right arrows or A/D keys
  const moveStep = 5;
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      player.x = Math.max(0, player.x - moveStep);
      playMoveSound();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      player.x = Math.min(width - player.w, player.x + moveStep);
      playMoveSound();
    }
  });

  let animId = requestAnimationFrame(loop);
})();
