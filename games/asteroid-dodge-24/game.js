// Minimalist Asteroid Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain).connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player
  const player = {
    w: 30,
    h: 30,
    x: width / 2,
    y: height - 40,
    speed: 5,
    color: '#0f0'
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frameCount = 0;

  // Starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
});
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
      color: '#888'
    });
  }

  function update() {
    // player movement
    if (keys['ArrowLeft']) {
      player.x -= player.speed;
      beep(440, 0.05);
    }
    if (keys['ArrowRight']) {
      player.x += player.speed;
      beep(660, 0.05);
    }
    // keep inside bounds
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // stars movement (slow downward drift)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.3; // drift speed
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // asteroids
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // collision detection (simple AABB)
    for (const a of asteroids) {
      if (
        player.x < a.x + a.w &&
        player.x + player.w > a.x &&
        player.y < a.y + a.h &&
        player.y + player.h > a.y
      ) {
        // game over
        beep(220, 0.5);
        cancelAnimationFrame(animId);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2);
        return;
      }
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw player triangle with gradient
    const grad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#0a0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // draw asteroids with rotation and shading
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      const angle = (a.x + a.y) % (Math.PI * 2); // simple deterministic spin
      ctx.rotate(angle);
      const radGrad = ctx.createRadialGradient(0, 0, a.w * 0.2, 0, 0, a.w / 2);
      radGrad.addColorStop(0, '#aaa');
      radGrad.addColorStop(1, '#555');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function loop() {
    frameCount++;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }
  let animId = requestAnimationFrame(loop);
})();
