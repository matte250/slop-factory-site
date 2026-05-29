// Simple Particle Escape game
// Canvas with id="game"

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context resumes on user interaction
  window.addEventListener('click', () => audioCtx.resume());
  window.addEventListener('keydown', () => audioCtx.resume());

  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCollision() {
    playBeep(200, 0.2);
  }

  function playGameOver() {
    playBeep(100, 0.3);
    setTimeout(() => playBeep(50, 0.4), 350);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to match element's CSS size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const PLAYER_RADIUS = 6;
  const PLAYER_SPEED = 3;
  const PARTICLE_COUNT = 30;
  const PARTICLE_RADIUS = 8;
  const PARTICLE_SPEED = 1.5;
  const GAME_TIME = 60; // seconds

  const player = { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0 };
  const particles = [];
  const keys = {};
  let remaining = GAME_TIME;
  let lastTime = null;
  let gameOver = false;
  let gameOverSoundPlayed = false;

  // Initialise particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * PARTICLE_SPEED,
      vy: (Math.random() - 0.5) * PARTICLE_SPEED,
    });
  }
  // Initialise background stars for depth effect
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Input handling
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // player movement
    player.vx = 0; player.vy = 0;
    if (keys['ArrowLeft'] || keys['a']) player.vx = -PLAYER_SPEED;
    if (keys['ArrowRight'] || keys['d']) player.vx = PLAYER_SPEED;
    if (keys['ArrowUp'] || keys['w']) player.vy = -PLAYER_SPEED;
    if (keys['ArrowDown'] || keys['s']) player.vy = PLAYER_SPEED;
    player.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player.x + player.vx * dt));
    player.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player.y + player.vy * dt));

    // move particles and bounce
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < PARTICLE_RADIUS || p.x > canvas.width - PARTICLE_RADIUS) p.vx *= -1;
      if (p.y < PARTICLE_RADIUS || p.y > canvas.height - PARTICLE_RADIUS) p.vy *= -1;
      // collision with player
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const distSq = dx * dx + dy * dy;
      const radSum = PARTICLE_RADIUS + PLAYER_RADIUS;
      if (distSq < radSum * radSum) {
        gameOver = true;
        playCollision();
      }
    }

    // timer
    remaining -= dt / 1000;
    if (remaining <= 0) gameOver = true;
  }

  function draw() {
    // Draw semi‑transparent overlay for motion blur effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#0a0a2a');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // draw background stars for depth
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // particles with radial gradient
    for (const p of particles) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, PARTICLE_RADIUS);
      grad.addColorStop(0, 'rgba(255, 80, 80, 0.9)');
      grad.addColorStop(1, 'rgba(150, 0, 0, 0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // player with glowing gradient
    const pGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, PLAYER_RADIUS);
    pGrad.addColorStop(0, 'rgba(80, 150, 255, 0.9)');
    pGrad.addColorStop(1, 'rgba(0, 0, 150, 0.5)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // timer
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.max(0, Math.ceil(remaining))}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      if (!gameOverSoundPlayed) {
        playGameOver();
        gameOverSoundPlayed = true;
      }
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
