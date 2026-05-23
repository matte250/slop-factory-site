// Neon Escape – enhanced graphics
// Canvas id="game" assumed in the surrounding HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // abort if missing
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // fullscreen canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // particle pool for jump/land effects
  const particles = [];

  const player = {
  w: 40,
  h: 40,
  x: 80,
  y: canvas.height - 100,
  vy: 0,
  color: '#0ff', // neon cyan
  onGround: true,
  prevOnGround: true,
};
  const GRAVITY = 0.8;
  const JUMP = -15;
  const obstacles = [];
  let lastObstacle = 0;
  let score = 0;

  // input – tap/click to jump
  canvas.addEventListener('pointerdown', async () => {
    // resume audio context on first interaction
    if (audioCtx.state !== 'running') await audioCtx.resume();
    // play jump sound
    playTone(440, 100);
    if (player.onGround) {
    if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
    }
  });

  function spawnObstacle() {
    // neon barrier with slight vertical variance and color variation
    const size = Math.random() * 30 + 20; // 20‑50px
    const gap = Math.random() * 200 + 150; // distance to next barrier
    obstacles.push({
      x: canvas.width + size,
      y: canvas.height - size - 60,
      w: size,
      h: size,
      speed: 6,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    });
    lastObstacle = performance.now() + gap;
  }

  function update(dt) {
    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += GRAVITY * 0.2;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;

    // ground handling & landing particles
    if (player.y + player.h >= canvas.height - 60) {
      player.y = canvas.height - 60 - player.h;
      player.vy = 0;
      player.onGround = true;
      if (!player.prevOnGround) {
        // landing sound
        playTone(220, 150);
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: player.x + player.w / 2,
            y: player.y + player.h,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            r: Math.random() * 3 + 2,
            life: 300,
            maxLife: 300,
          });
        }
      }
    } else {
      player.onGround = false;
    }
    player.prevOnGround = player.onGround;

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    if (performance.now() > lastObstacle) spawnObstacle();

    // collision detection (AABB)
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        cancelAnimationFrame(animId);
        alert('Game Over! Score: ' + Math.floor(score / 1000));
        return;
      }
    }

    score += dt;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0d0d0d');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ground line
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 60);
    ctx.lineTo(canvas.width, canvas.height - 60);
    ctx.stroke();

    // particles – glowing circles
    for (const p of particles) {
      const alpha = Math.max(p.life / p.maxLife, 0);
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // player – glowing square
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // obstacles – neon bars with per‑obstacle color
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.shadowBlur = 0;

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 20, 30);
  }

  let last = performance.now();
  let animId;
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  // start the game
  spawnObstacle();
  loop();
})();
