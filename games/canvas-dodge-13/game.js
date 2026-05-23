// Canvas Dodge Game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Background hum
  setInterval(() => playTone(50, 200), 3000);
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player (spaceship) configuration
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, speed: Math.random() * 0.5 + 0.2 });
  }
  const player = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  let audioStarted = false;
  function ensureAudio() { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } }
  document.addEventListener('keydown', e => { if (e.key in keys) { keys[e.key] = true; ensureAudio(); playTone(300, 50); } });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    asteroids.push({
      x: Math.random() * (width - radius * 2) + radius,
      y: -radius,
      r: radius,
      speed: Math.random() * 2 + 1,
      angle: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.05
    });
  }
  let spawnTimer = 0;

  let gameOver = false;
  function loop(timestamp) {
    if (gameOver) return;
    // Draw moving star background with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    for (let s = 0; s < stars.length; s++) {
      const star = stars[s];
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
      ctx.fillRect(star.x, star.y, 2, 2);
    }
    // Update player
    player.dx = 0;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x + player.dx));
    // Draw player as triangle spaceship
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // Spawn asteroids
    spawnTimer += 16; // approx ms per frame
    if (spawnTimer > 800) { spawnAsteroid(); spawnTimer = 0; }
    // Update and draw asteroids with rotation and gradient
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // Move
      a.y += a.speed;
      a.angle += a.rotationSpeed;
      // Draw with rotation
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#f99');
      grad.addColorStop(1, '#a22');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Collision with player
      if (a.y + a.r > player.y && a.x > player.x && a.x < player.x + player.w) {
        gameOver = true;
        playTone(120, 300); // collision sound
        alert('Game Over!');
        return;
      }
      // Remove off‑screen
      if (a.y - a.r > height) { asteroids.splice(i, 1); }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
