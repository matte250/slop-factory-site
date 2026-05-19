// Simple Space Junk Collector game
// Canvas element with id="game" must exist in the HTML.

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const state = {
    player: { x: canvas.width / 2, y: canvas.height - 50, w: 30, h: 30, speed: 4 },
    junk: [],
    asteroids: [],
    score: 0,
    gameOver: false,
    keys: {},
    // Audio context and helper
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
    playTone(freq, duration) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.01);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.stop(this.audioCtx.currentTime + duration);
    }
  };

  // Input handling
  window.addEventListener('keydown', e => {
      // Resume audio context on first interaction
      if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
      state.keys[e.key] = true;
    });
  window.addEventListener('keyup', e => { state.keys[e.key] = false; });

  // Create background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
  }

  function spawnJunk() {
    const size = 8;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 1 + Math.random() * 1.5;
    state.junk.push({ x, y, size, speed });
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 15;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 0.5 + Math.random() * 1.0;
    state.asteroids.push({ x, y, size, speed });
  }

  // Simple rectangle-circle collision for junk, circle-circle for asteroids
  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x + circle.r - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y + circle.r - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function circleCollide(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  }

  function update() {
    if (state.gameOver) return;
    // Move player
    if (state.keys['ArrowLeft']) state.player.x -= state.player.speed;
    if (state.keys['ArrowRight']) state.player.x += state.player.speed;
    if (state.keys['ArrowUp']) state.player.y -= state.player.speed;
    if (state.keys['ArrowDown']) state.player.y += state.player.speed;
    // Keep inside bounds
    state.player.x = Math.max(0, Math.min(canvas.width - state.player.w, state.player.x));
    state.player.y = Math.max(0, Math.min(canvas.height - state.player.h, state.player.y));

    // Update background stars for parallax effect
    for (const s of stars) {
      s.y += 0.5; // slow drift
      if (s.y > canvas.height) s.y = 0;
    }

    // Update junk
    state.junk.forEach(j => { j.y += j.speed; });
    state.junk = state.junk.filter(j => j.y < canvas.height);
    // Update asteroids
    state.asteroids.forEach(a => { a.y += a.speed; });
    state.asteroids = state.asteroids.filter(a => a.y < canvas.height);

    // Collision detection
    const playerRect = { x: state.player.x, y: state.player.y, w: state.player.w, h: state.player.h };
    // Collect junk
    state.junk = state.junk.filter(j => {
      const circle = { x: j.x, y: j.y, r: j.size };
if (rectCircleCollide(playerRect, circle)) {
          state.score++;
          // Play a short collecting tone
          state.playTone(800, 0.08);
          return false; // remove collected junk
        }
      return true;
    });
    // Asteroid hit ends game
    for (const a of state.asteroids) {
      const circle = { x: a.x, y: a.y, r: a.size };
if (rectCircleCollide(playerRect, circle)) {
          state.gameOver = true;
          // Play a low, longer tone for crash
          state.playTone(200, 0.5);
          break;
        }
    }

    // Random spawns
    if (Math.random() < 0.02) spawnJunk(); // approx every 50 frames
    if (Math.random() < 0.005) spawnAsteroid(); // less frequent
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#00102e');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw background stars with subtle twinkling
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5; // flicker
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw player (stylized ship with gradient)
    const shipGrad = ctx.createLinearGradient(
      state.player.x,
      state.player.y,
      state.player.x + state.player.w,
      state.player.y + state.player.h
    );
    shipGrad.addColorStop(0, '#00fff7');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(state.player.x + state.player.w / 2, state.player.y);
    ctx.lineTo(state.player.x, state.player.y + state.player.h);
    ctx.lineTo(state.player.x + state.player.w, state.player.y + state.player.h);
    ctx.closePath();
    ctx.fill();

    // Draw junk with radial gradient
    for (const j of state.junk) {
      const grad = ctx.createRadialGradient(j.x, j.y, 0, j.x, j.y, j.size);
      grad.addColorStop(0, '#ffd700');
      grad.addColorStop(1, '#b8860b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(j.x, j.y, j.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw asteroids with textured gradient
    for (const a of state.asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + state.score, 10, 20);
    if (state.gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!state.gameOver) requestAnimationFrame(loop);
  }

  // Start loop
  requestAnimationFrame(loop);
});
