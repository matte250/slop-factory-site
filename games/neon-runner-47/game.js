// Simple Neon Runner implementation targeting <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Background stars for parallax effect
  const bgStars = [];
  for (let i = 0; i < 50; i++) {
    bgStars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 0.5,
      size: 1 + Math.random() * 2,
    });
  }

  // Particle trail for jumps
  const particles = [];

  // Player definition
  const player = {
    x: 50,
    y: height - 60,
    w: 30,
    h: 30,
    vy: 0,
    jumpStrength: -12,
    color: '#0ff',
    onGround: true,
  };

  const gravity = 0.6;
  const obstacles = [];
  let frame = 0;
  let score = 0;
  let running = true;

  // Input handling – space or tap
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      // Play jump sound
      playTone(660, 0.12);
      // Emit particles on jump
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h / 2,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1,
          life: 30,
          size: 2 + Math.random() * 2,
        });
      }
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // Obstacle generator
  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    obstacles.push({
      x: width + size,
      y: height - size - 30,
      w: size,
      h: size,
      speed: 6,
      color: '#f0f',
    });
  };

  const update = () => {
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= height - 30) {
      player.y = height - 30 - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Update background stars (parallax scroll)
    for (const s of bgStars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
        s.speed = 0.5 + Math.random() * 0.5;
        s.size = 1 + Math.random() * 2;
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity effect
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Obstacles movement & cleanup
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // Spawn logic
    if (frame % 90 === 0) spawnObstacle();

    // Collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // Play crash sound and stop game
        playTone(200, 0.5);
        running = false;
      }
    }

    frame++;
  };

  const draw = () => {
    // Clear
    ctx.clearRect(0, 0, width, height);
    // Background gradient (neon vibe)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#112');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Draw background stars (parallax)
    ctx.fillStyle = '#88f';
    for (const s of bgStars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw particles (jump trails)
    ctx.fillStyle = '#0ff';
    for (const p of particles) {
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player with neon glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // Obstacles with glow
    for (const o of obstacles) {
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const loop = () => {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f66';
      ctx.font = '32px monospace';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  loop();
})();
