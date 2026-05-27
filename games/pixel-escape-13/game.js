// Simple canvas game based on IDEA.md
// Canvas element with id="game" must exist in the HTML page.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  let audioCtx = null;
  function initAudio(){
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  function playTone(freq, dur){
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur/1000);
    osc.start(now);
    osc.stop(now + dur/1000);
  }
  function playStar(){ playTone(800, 100); }
  function playCollision(){ playTone(150, 300); }
  function playMove(){ playTone(400, 50); }
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set a default size if the HTML does not specify one.
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const player = { x: canvas.width / 2, y: canvas.height / 2, size: 20, speed: 3 };
  const enemies = [];
  const spikes = [];
  const stars = [];
  const particles = []; // visual particles for star collection
  let score = 0;
  let gameOver = false;
  const keys = {};

  // Input handling
  window.addEventListener('keydown', e => { initAudio(); keys[e.key] = true; playMove(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Helper to get a random edge position
  function randomEdgePos() {
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: // top
        return { x: Math.random() * canvas.width, y: -20 };
      case 1: // bottom
        return { x: Math.random() * canvas.width, y: canvas.height + 20 };
      case 2: // left
        return { x: -20, y: Math.random() * canvas.height };
      default: // right
        return { x: canvas.width + 20, y: Math.random() * canvas.height };
    }
  }

  function spawnEnemy() {
    const pos = randomEdgePos();
    enemies.push({ x: pos.x, y: pos.y, size: 20, speed: 1.5 });
  }

  function spawnSpike() {
    const pos = randomEdgePos();
    spikes.push({ x: pos.x, y: pos.y, size: 15, speed: 2 });
  }

  function spawnStar() {
    const margin = 30;
    stars.push({
      x: margin + Math.random() * (canvas.width - 2 * margin),
      y: margin + Math.random() * (canvas.height - 2 * margin),
      size: 10,
    });
  }

  // Periodic spawns
  const enemyTimer = setInterval(spawnEnemy, 2000);
  const spikeTimer = setInterval(spawnSpike, 3000);
  const starTimer = setInterval(spawnStar, 4000);

  function moveEntity(e) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;
  }

  function rectCircleCollision(rect, circ) {
    // Closest point on rectangle to circle centre
    const cx = Math.max(rect.x, Math.min(circ.x, rect.x + rect.size));
    const cy = Math.max(rect.y, Math.min(circ.y, rect.y + rect.size));
    const dist = Math.hypot(circ.x - cx, circ.y - cy);
    return dist < circ.size;
  }

  function update() {
    if (gameOver) return;
    // Player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Move enemies and spikes toward player
    enemies.forEach(moveEntity);
    spikes.forEach(moveEntity);

    // Collision detection
    // Ensure audio context is active before playing sounds
    initAudio();
    for (const e of enemies) {
      if (rectCircleCollision(player, e)) { playCollision(); gameOver = true; break; }
    }
    for (const s of spikes) {
      if (rectCircleCollision(player, s)) { playCollision(); gameOver = true; break; }
    }
    // Star collection and particle effect
    for (let i = stars.length - 1; i >= 0; i--) {
      const star = stars[i];
      const dx = player.x + player.size / 2 - star.x;
      const dy = player.y + player.size / 2 - star.y;
      if (Math.hypot(dx, dy) < player.size / 2 + star.size) {
        score++;
        playStar();
        // create burst particles
        for (let p = 0; p < 8; p++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: star.x,
            y: star.y,
            vx: Math.cos(angle) * (1 + Math.random() * 2),
            vy: Math.sin(angle) * (1 + Math.random() * 2),
            alpha: 1,
            life: 30,
          });
        }
        stars.splice(i, 1);
      }
    }
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 1 / p.life;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Player (blue rounded square with gradient)
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.size, player.y + player.size);
    playerGrad.addColorStop(0, '#6ab8ff');
    playerGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = playerGrad;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.size - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + radius);
    ctx.lineTo(player.x + player.size, player.y + player.size - radius);
    ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - radius, player.y + player.size);
    ctx.lineTo(player.x + radius, player.y + player.size);
    ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // Enemies (red rounded squares with gradient)
    enemies.forEach(e => {
      const grad = ctx.createLinearGradient(e.x, e.y, e.x + e.size, e.y + e.size);
      grad.addColorStop(0, '#ff6f61');
      grad.addColorStop(1, '#c0392b');
      ctx.fillStyle = grad;
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(e.x + r, e.y);
      ctx.lineTo(e.x + e.size - r, e.y);
      ctx.quadraticCurveTo(e.x + e.size, e.y, e.x + e.size, e.y + r);
      ctx.lineTo(e.x + e.size, e.y + e.size - r);
      ctx.quadraticCurveTo(e.x + e.size, e.y + e.size, e.x + e.size - r, e.y + e.size);
      ctx.lineTo(e.x + r, e.y + e.size);
      ctx.quadraticCurveTo(e.x, e.y + e.size, e.x, e.y + e.size - r);
      ctx.lineTo(e.x, e.y + r);
      ctx.quadraticCurveTo(e.x, e.y, e.x + r, e.y);
      ctx.closePath();
      ctx.fill();
    });
    // Spikes (gradient triangles with shadow)
    spikes.forEach(s => {
      const grad = ctx.createLinearGradient(s.x - s.size / 2, s.y, s.x + s.size / 2, s.y + s.size);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.size / 2);
      ctx.lineTo(s.x - s.size / 2, s.y + s.size / 2);
      ctx.lineTo(s.x + s.size / 2, s.y + s.size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0; // reset after
    });
    // Stars (glowing gradient circles)
    stars.forEach(st => {
      const grad = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.size);
      grad.addColorStop(0, '#fff176');
      grad.addColorStop(1, '#f1c40f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Particles (fading white sparks)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);

  // Optional: restart on click after game over
  canvas.addEventListener('click', () => {
    if (!gameOver) return;
    // Reset state
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    enemies.length = 0;
    spikes.length = 0;
    stars.length = 0;
    score = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  });
})();
