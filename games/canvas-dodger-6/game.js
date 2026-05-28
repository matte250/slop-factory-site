// game.js – Canvas Dodger implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const setSize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  setSize();
  addEventListener('resize', setSize);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(800, 0.1);
  const playCollision = () => playTone(200, 0.3);

  // Player (controlled by mouse)
  const player = { x: canvas.width / 2, y: canvas.height / 2, r: 15, color: '#00f' };
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
    audioCtx.resume(); // ensure context is running after user interaction
  });

  // Game objects
  const obstacles = [];
  const stars = [];
  let score = 0;
  let gameOver = false;

  const rand = (min, max) => Math.random() * (max - min) + min;
  const spawnObstacle = () => {
    const size = rand(10, 30);
    const side = Math.floor(rand(0, 4)); // 0:left,1:top,2:right,3:bottom
    let x, y, vx, vy;
    const speed = rand(1, 3);
    switch (side) {
      case 0: x = -size; y = rand(0, canvas.height); vx = speed; vy = rand(-1, 1); break;
      case 1: x = rand(0, canvas.width); y = -size; vx = rand(-1, 1); vy = speed; break;
      case 2: x = canvas.width + size; y = rand(0, canvas.height); vx = -speed; vy = rand(-1, 1); break;
      case 3: x = rand(0, canvas.width); y = canvas.height + size; vx = rand(-1, 1); vy = -speed; break;
    }
    obstacles.push({ x, y, r: size, vx, vy, color: `hsl(${rand(0, 360)},70%,50%)` });
  };

  const spawnStar = () => {
    const size = 12;
    const x = rand(size, canvas.width - size);
    const y = rand(size, canvas.height - size);
    const vx = rand(-2, 2);
    const vy = rand(-2, 2);
    stars.push({ x, y, r: size, vx, vy, color: '#ff0' });
  };

  // Initial spawns
  setInterval(spawnObstacle, 1000);
  setInterval(spawnStar, 5000);

  const detectCollision = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  };

  const loop = () => {
    if (gameOver) return;
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with radial gradient and outline
    const grad = ctx.createRadialGradient(
      player.x, player.y, player.r * 0.2,
      player.x, player.y, player.r
    );
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, player.color);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Update & draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx; o.y += o.vy;
        // Draw obstacle with gradient and slight shadow
        const oGrad = ctx.createRadialGradient(
          o.x, o.y, o.r * 0.2,
          o.x, o.y, o.r
        );
        oGrad.addColorStop(0, '#fff');
        oGrad.addColorStop(1, o.color);
        ctx.save();
        ctx.shadowColor = o.color;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = oGrad; ctx.fill();
        ctx.restore();
      if (detectCollision(player, o)) { playCollision(); gameOver = true; }
      // Remove off‑screen
      if (o.x < -o.r || o.x > canvas.width + o.r || o.y < -o.r || o.y > canvas.height + o.r) {
        obstacles.splice(i, 1);
      }
    }

    // Update & draw stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x += s.vx; s.y += s.vy;
      // Draw star with radial gradient and glow
      const starGrad = ctx.createRadialGradient(
        s.x, s.y, s.r * 0.2,
        s.x, s.y, s.r
      );
      starGrad.addColorStop(0, '#fff');
      starGrad.addColorStop(1, s.color);
      ctx.save();
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = starGrad; ctx.fill();
      ctx.restore();
      if (detectCollision(player, s)) { playCollect(); score++; stars.splice(i, 1); }
      // Keep stars on screen
      if (s.x < -s.r || s.x > canvas.width + s.r) s.vx *= -1;
      if (s.y < -s.r || s.y > canvas.height + s.r) s.vy *= -1;
    }

    // Score display
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 30);

    if (!gameOver) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    }
  };

  requestAnimationFrame(loop);
})();
