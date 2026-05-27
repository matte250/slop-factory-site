// Simple "Cosmic Dodge" game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  // Audio setup
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
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  function playSpawnSound(){ playTone(400, 0.05); }
  function playCollisionSound(){ playTone(150, 0.4); }
  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    // regenerate stars for new size
    generateStars(200);
    // update player gradient to match new size
    createPlayerGradient();
  }

  // Star field data
  const stars = [];
  function generateStars(count) {
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width / dpr,
        y: Math.random() * canvas.height / dpr,
        // brightness will fluctuate each frame
        brightness: 0.5 + Math.random() * 0.5,
      });
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // Player (triangle) definition
  const player = {
    x: 80,
    y: canvas.height / (dpr * 2),
    size: 20,
    speed: 300, // pixels per second
    // Use a cyan gradient for a futuristic look
    color: null,
  };
  // Create player gradient once (will be updated on resize)
  function createPlayerGradient(){
    const grad = ctx.createLinearGradient(0, player.y - player.size/2, 0, player.y + player.size/2);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#00f');
    player.color = grad;
  }


  const keys = new Set();
  window.addEventListener('keydown', e => keys.add(e.key));
  window.addEventListener('keyup', e => keys.delete(e.key));
  // Ensure audio context runs after user interaction
  window.addEventListener('click', () => audioCtx.resume());
  window.addEventListener('keydown', () => audioCtx.resume());

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    asteroids.push({
      x: canvas.width / dpr + radius,
      y: Math.random() * (canvas.height / dpr),
      r: radius,
      speed: 100 + Math.random() * 150,
    });
    playSpawnSound();
  }

  let lastTime = performance.now();
  let score = 0;

  function update(dt) {
    // Player movement
    const moveDist = player.speed * dt;
    if (keys.has('ArrowUp') || keys.has('w')) player.y -= moveDist;
    if (keys.has('ArrowDown') || keys.has('s')) player.y += moveDist;
    if (keys.has('ArrowLeft') || keys.has('a')) player.x -= moveDist;
    if (keys.has('ArrowRight') || keys.has('d')) player.x += moveDist;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(player.x, canvas.width / dpr));
    player.y = Math.max(0, Math.min(player.y, canvas.height / dpr));

    // Asteroid movement & spawn
    asteroids.forEach(a => a.x -= a.speed * dt);
    // Remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].x + asteroids[i].r < 0) asteroids.splice(i, 1);
    }
    // Spawn new
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Collision detection (simple circle‑point check)
    for (const a of asteroids) {
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + player.size / 2) {
        // Game over – stop animation
        playCollisionSound();
        alert('Game Over! Score: ' + Math.floor(score));
        // Reset state
        asteroids.length = 0;
        player.x = 80;
        player.y = canvas.height / (dpr * 2);
        score = 0;
        break;
      }
    }

    // Scoring
    score += dt * 10; // 10 points per second
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Enhanced background with gradient and twinkling stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height / dpr);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    // Update and draw stars with twinkle effect
    ctx.fillStyle = '#fff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      // Slightly vary brightness each frame
      s.brightness = 0.5 + Math.random() * 0.5;
      ctx.globalAlpha = s.brightness;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1.0;

    // Draw player triangle with gradient fill
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size / 2);
    ctx.lineTo(player.x - player.size / 2, player.y + player.size / 2);
    ctx.lineTo(player.x + player.size / 2, player.y + player.size / 2);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with subtle radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
