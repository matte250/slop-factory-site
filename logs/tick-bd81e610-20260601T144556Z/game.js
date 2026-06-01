// Minimal Neon Runner implementation
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  // create starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.5,
    });
  }
  // particles for orb collection
  const particles = [];
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 400);
  const GRAVITY = 0.6;
  const PLAYER = { x: 50, y: H - 50, w: 30, h: 30, vy: 0, jumping: false };
  let speed = 4;
  let dashTimer = 0;
  let score = 0;
  const obstacles = [];
  const orbs = [];
  let frame = 0;
  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.key === 'ArrowUp' && !PLAYER.jumping) {
      PLAYER.vy = -12;
      PLAYER.jumping = true;
      playTone(440);
    }
    if (e.key === 'ArrowRight' && dashTimer === 0) {
      speed = 8;
      dashTimer = 60; // 1 sec at 60fps
      playTone(300);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  function spawnObstacle() {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 30;
    obstacles.push({ x: W, y: H - h, w, h });
  }
  function spawnOrb() {
    const size = 15;
    const y = H - 80 - Math.random() * 150;
    orbs.push({ x: W, y, w: size, h: size, collected: false });
  }
  function update() {
    // update stars (twinkling)
    stars.forEach(s => {
      // slight horizontal drift
      s.x += 0.1;
      if (s.x > W) s.x = 0;
    });
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    frame++;
    // Player physics
    PLAYER.vy += GRAVITY;
    PLAYER.y += PLAYER.vy;
    if (PLAYER.y > H - PLAYER.h) {
      PLAYER.y = H - PLAYER.h;
      PLAYER.vy = 0;
      PLAYER.jumping = false;
    }
    // Dash timing
    if (dashTimer > 0) {
      dashTimer--;
      if (dashTimer === 0) speed = 4;
    }
    // Spawn obstacles/orbs
    if (frame % 120 === 0) spawnObstacle(); // every 2 sec
    if (frame % 300 === 0) spawnOrb(); // every 5 sec
    // Move and cull obstacles
    obstacles.forEach(o => (o.x -= speed));
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // Move and cull orbs
    orbs.forEach(b => (b.x -= speed));
    while (orbs.length && orbs[0].x + orbs[0].w < 0) orbs.shift();
    // Collision detection
    for (const o of obstacles) {
      if (
        PLAYER.x < o.x + o.w &&
        PLAYER.x + PLAYER.w > o.x &&
        PLAYER.y < o.y + o.h &&
        PLAYER.y + PLAYER.h > o.y
      ) {
        // Game over – reset
        playTone(150);
        alert('Game Over! Score: ' + Math.floor(score));
        location.reload();
        return;
      }
    }
    for (const b of orbs) {
      if (!b.collected &&
        PLAYER.x < b.x + b.w &&
        PLAYER.x + PLAYER.w > b.x &&
        PLAYER.y < b.y + b.h &&
        PLAYER.y + PLAYER.h > b.h + b.y
      ) {
        b.collected = true;
        // create burst particles
        for (let i = 0; i < 12; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: b.x + b.w / 2,
            y: b.y + b.h / 2,
            vx: Math.cos(angle) * (2 + Math.random() * 2),
            vy: Math.sin(angle) * (2 + Math.random() * 2),
            life: 30 + Math.random() * 20,
            size: 2 + Math.random() * 2,
          });
        }
        speed = 6; // temporary boost
        setTimeout(() => (speed = 4), 2000);
      }
    }
    score += 0.02;
  }
  function draw() {
    // clear canvas
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // neon glow for entities
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    // player neon square with glow
    ctx.fillStyle = '#0ff';
    ctx.fillRect(PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h);
    // obstacles (red glow)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // orbs (yellow glow)
    ctx.fillStyle = '#ff0';
    orbs.forEach(b => {
      if (!b.collected) ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    // reset shadow for UI text
    ctx.shadowBlur = 0;
    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
