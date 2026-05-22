// Simple Sky Diver game based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player is a circle, thrust flag for flame effect
  const player = { x: width / 2, y: height - 50, r: 15, vy: 0, thrust: false };
  const GRAVITY = 0.4;
  const THRUST = -9;
  const obstacles = [];
  const stars = [];
  const particles = [];
  let lastSpawn = 0;
  let gameOver = false;

  // Initialise starfield background
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrustSound() { playBeep(300, 0.1); }
  function playCrashSound() { playBeep(100, 0.3); }

  for (let i = 0; i < 80; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  function spawnObstacle() {
    // Spike shaped obstacle (triangle)
    const size = 30 + Math.random() * 30;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, size, speed: 2 + Math.random() * 2 });
  }

  function spawnParticle(x, y) {
    particles.push({ x, y, vy: -1 - Math.random() * 1, life: 30, r: 2 + Math.random() * 2 });
  }

  function update(dt) {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.r > height) { player.y = height - player.r; player.vy = 0; }
    // obstacles movement & collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i, 1);
      // simple triangle collision check (bounding box)
      if (player.x - player.r < o.x + o.size && player.x + player.r > o.x &&
          player.y - player.r < o.y + o.size && player.y + player.r > o.y) {
        gameOver = true;
        // play crash sound
        playCrashSound();
        break;
      }
    }
    // particles update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // spawn obstacles periodically
    if (performance.now() - lastSpawn > 1400) { spawnObstacle(); lastSpawn = performance.now(); }
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#003566');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.r, s.r));
    // draw particles (thrust flame)
    particles.forEach(p => {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,150,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw player (circle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // draw obstacles as triangles
    ctx.fillStyle = '#a00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.size);
      ctx.lineTo(o.x + o.size / 2, o.y);
      ctx.lineTo(o.x + o.size, o.y + o.size);
      ctx.closePath();
      ctx.fill();
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // thrust on click/tap – also emit particles
  function applyThrust() {
    player.vy = THRUST;
    player.thrust = true;
    // emit a burst of particles
    for (let i = 0; i < 8; i++) {
      spawnParticle(player.x, player.y + player.r);
    }
    // play thrust sound
    playThrustSound();
    // clear thrust flag after short timeout
    setTimeout(() => player.thrust = false, 100);
  }
  canvas.addEventListener('mousedown', applyThrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); applyThrust(); }, { passive: false });

  requestAnimationFrame(loop);
})();
