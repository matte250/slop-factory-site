// Neon Runner – minimal canvas game
// Assumes a <canvas id="game"></canvas> exists.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Player properties and particle system
  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: 0,
    vy: 0,
    jumpStrength: -12,
    color: '#0ff',
    onGround: false,
  };
  let particles = [];

  // Simple obstacle generator
  const obstacles = [];
  const obstacleW = 30;
  const obstacleGap = 2000; // ms between obstacles
  let lastObstacle = 0;
  const speed = 4; // scroll speed

  // Input handling (space or click/tap)
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playTone(500, 0.12); // jump sound
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  // Game loop
  let startTime = null;
  let score = 0;
  const loop = timestamp => {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - startTime) / 1000; // seconds
    startTime = timestamp;
    // Clear
          // Neon gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0a0a2a');
      bgGrad.addColorStop(1, '#02020f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw ground line
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 4);
      ctx.lineTo(canvas.width, canvas.height - 4);
      ctx.stroke();

    // Update player physics
    player.vy += 30 * dt; // gravity
    player.y += player.vy;
    const groundY = canvas.height - 20 - player.h; // 20px neon ground height
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw player
           // Neon player with glow
       ctx.save();
       ctx.shadowColor = player.color;
       ctx.shadowBlur = 15;
       ctx.fillStyle = player.color;
       // rounded rectangle
       const radius = 6;
       ctx.beginPath();
       ctx.moveTo(player.x + radius, player.y);
       ctx.lineTo(player.x + player.w - radius, player.y);
       ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
       ctx.lineTo(player.x + player.w, player.y + player.h - radius);
       ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
       ctx.lineTo(player.x + radius, player.y + player.h);
       ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
       ctx.lineTo(player.x, player.y + radius);
       ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
       ctx.closePath();
       ctx.fill();
       ctx.restore();
       // Emit particle at player center
       particles.push({x: player.x + player.w/2, y: player.y + player.h/2, alpha: 1});

    // Generate obstacles
    if (timestamp - lastObstacle > obstacleGap) {
      const type = Math.random() < 0.5 ? 'gap' : 'spike';
      if (type === 'gap') {
        // gap: we simulate by lowering ground for a short width
        obstacles.push({type, x: canvas.width, width: 80, y: groundY + player.h});
      } else {
        // spike: a tall rectangle from ground
        obstacles.push({type, x: canvas.width, width: obstacleW, y: groundY - 40});
      }
      lastObstacle = timestamp;
    }

    // Update & draw obstacles, check collisions
    // Particle trail for player
    particles = particles.filter(p => p.alpha > 0);
      particles.forEach(p => {
        // draw glow particle
        ctx.save();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
        grad.addColorStop(0, `rgba(0,255,255,${p.alpha})`);
        grad.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // fade out
        p.alpha -= dt * 1.5;
      });

    ctx.fillStyle = '#f0f';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.type === 'gap') {
        // visual gap: darkened strip
        ctx.fillStyle = '#03030f';
        ctx.fillRect(o.x, groundY + player.h, o.width, canvas.height - groundY - player.h);
        // collision: player falls if over gap
        if (player.x + player.w > o.x && player.x < o.x + o.width) {
          if (player.onGround) {
            player.onGround = false;
          }
        }
        ctx.fillStyle = '#f0f'; // reset for other drawing
      } else { // spike
        // draw neon spike as triangle with glow
        ctx.save();
        ctx.shadowColor = '#f0f';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#f0f';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + 40);
        ctx.lineTo(o.x + o.width / 2, o.y);
        ctx.lineTo(o.x + o.width, o.y + 40);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // collision detection (approximate bounding box)
        if (player.x < o.x + o.width && player.x + player.w > o.x &&
            player.y + player.h > o.y) {
          // Play death sound
          playTone(150, 0.4);
          alert('Game Over! Score: ' + Math.floor(score));
          document.location.reload();
          return;
        }
      }
      // remove off‑screen
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    // Update score
    score += speed * dt;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
