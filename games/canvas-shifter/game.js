// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(800, 0.1);
  const playCollision = () => playTone(150, 0.3);
  const w = (canvas.width = canvas.clientWidth);
  const h = (canvas.height = canvas.clientHeight);

  const player = { x: w / 2, y: h - 60, size: 30, color: '#ff4081', vx: 0, vy: 0 };
  let target = null;
let obstacles = [];
let orbs = [];
let stars = [];
let score = 0;
let lastSpawn = 0;
let starSpawn = 0;
let gameOver = false;

  // Input handling (mouse / touch)
  const setTarget = (e) => {
    // Ensure audio context is running after first user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target = { x, y };
  };
  canvas.addEventListener('pointerdown', setTarget);
  canvas.addEventListener('pointermove', (e) => { if (target) setTarget(e); });
  canvas.addEventListener('pointerup', () => (target = null));

  const spawnObstacle = () => {
    const size = 60 + Math.random() * 40;
    const gap = size * 0.6; // gap width inside block
    const x = w + size;
    const y = Math.random() * (h - size);
    const speed = 2 + Math.random() * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.04;
    obstacles.push({ x, y, size, gap, speed, angle: 0, rotSpeed });
  };

  const spawnOrb = () => {
    const radius = 8;
    const x = w + radius;
    const y = Math.random() * (h - radius * 2) + radius;
    const speed = 2.5;
    orbs.push({ x, y, radius, speed });
  };

  const spawnStar = () => {
    const size = Math.random() * 2 + 0.5; // tiny star
    const x = w + size;
    const y = Math.random() * h;
    const speed = 1 + Math.random();
    stars.push({ x, y, size, speed, opacity: Math.random() * 0.5 + 0.5 });
  };

  const update = (dt) => {
    if (gameOver) return;
    // Move player towards target
    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const step = Math.min(dist, 4);
        player.x += (dx / dist) * step;
        player.y += (dy / dist) * step;
      }
    }
    // Keep player within canvas horizontally (vertical off‑screen is lose)
    if (player.x < 0) player.x = 0;
    if (player.x > w) player.x = w;
    if (player.y < 0 || player.y > h) gameOver = true;

    // Obstacles move left
    obstacles.forEach((o) => {
      o.x -= o.speed;
      o.angle += o.rotSpeed;
    });
    obstacles = obstacles.filter((o) => o.x + o.size > 0);

    // Orbs move left
    orbs.forEach((o) => (o.x -= o.speed));
    orbs = orbs.filter((o) => o.x + o.radius > 0);

    // Collision detection (simple AABB against rotating block)
    for (const o of obstacles) {
      // Transform player point into obstacle's local space
      const cx = o.x - o.size / 2;
      const cy = o.y - o.size / 2;
      const sin = Math.sin(-o.angle);
      const cos = Math.cos(-o.angle);
      const px = player.x - cx;
      const py = player.y - cy;
      const localX = px * cos - py * sin + o.size / 2;
      const localY = px * sin + py * cos + o.size / 2;
      const inBlock =
        localX < o.size && localY < o.size && // inside square
        !(localX > (o.size - o.gap) / 2 && localX < (o.size + o.gap) / 2 &&
          localY > (o.size - o.gap) / 2 && localY < (o.size + o.gap) / 2);
      if (inBlock) {
        playCollision();
        gameOver = true;
        break;
      }
    }

    // Orb collection
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      if (dx * dx + dy * dy < (o.radius + player.size / 2) ** 2) {
        playCollect();
        score++;
        orbs.splice(i, 1);
      }
    }

    // Spawn logic
    const now = performance.now();
    // obstacles and occasional orbs
    if (now - lastSpawn > 1500) {
      spawnObstacle();
      if (Math.random() < 0.5) spawnOrb();
      lastSpawn = now;
    }
    // starfield – spawn many faint stars
    if (now - starSpawn > 300) {
      spawnStar();
      starSpawn = now;
    }
    // update stars movement and fade
    stars.forEach((s) => {
      s.x -= s.speed;
      s.opacity -= 0.001; // slowly fade
    });
    stars = stars.filter((s) => s.x + s.size > 0 && s.opacity > 0);
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    // Draw background and player with gradient
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    // Player gradient
    const playerGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.size / 2);
    playerGrad.addColorStop(0, '#ff80ab');
    playerGrad.addColorStop(1, '#ff4081');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw stars (twinkling background)
        ctx.shadowColor = 'transparent'; // no shadow for stars
        stars.forEach((s) => {
          ctx.save();
          ctx.globalAlpha = s.opacity;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Draw obstacles
        // Obstacle gradient and shadow
        const obsGrad = ctx.createLinearGradient(0, 0, 0, h);
        obsGrad.addColorStop(0, '#555');
        obsGrad.addColorStop(1, '#222');
        ctx.fillStyle = obsGrad;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        obstacles.forEach((o) => {
          ctx.save();
          ctx.translate(o.x, o.y);
          ctx.rotate(o.angle);
          ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
          // cutout gap (transparent)
          ctx.clearRect(
            -o.gap / 2,
            -o.gap / 2,
            o.gap,
            o.gap
          );
          ctx.restore();
        });
    // Draw glowing orbs
    orbs.forEach((o) => {
      ctx.save();
      const glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius * 2);
      glow.addColorStop(0, 'rgba(255,215,0,0.9)');
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', w / 2, h / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Score: ' + score, w / 2, h / 2 + 20);
    }
  };

  const loop = (timestamp) => {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
