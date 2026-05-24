// Minimal Neon Asteroid Miner
// Canvas with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects (initialized on first user interaction)
  let audioCtx;
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, duration) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaserSound() { playTone(800, 0.08); }
  function playExplosionSound() { playTone(200, 0.2); }
  function playGameOverSound() { playTone(100, 0.5); }

  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = canvas.offsetHeight);

  // ----- Game objects -----
  const drone = {
    x: W / 2,
    y: H - 40,
    w: 30,
    h: 15,
    speed: 4,
    health: 3,
    color: '#0ff',
  };

  const asteroids = [];
  const lasers = [];
  let score = 0;
  let gameOver = false;
  let frame = 0;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.code] = true));
  window.addEventListener('keyup', (e) => (keys[e.code] = false));

  // ----- Helpers -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() {
    const size = rand(15, 40);
    asteroids.push({
      x: rand(0, W - size),
      y: -size,
      r: size / 2,
      speed: rand(1, 3),
      color: '#f0f',
      damage: size > 30 ? 2 : 1,
    });
  }

  function fireLaser() {
    playLaserSound();
    lasers.push({
      x: drone.x,
      y: drone.y - drone.h / 2,
      w: 2,
      h: 10,
      speed: 6,
    });
  }

  // ----- Game Loop -----
  function update() {
    if (gameOver) return;
    // Drone movement
    if (keys['ArrowLeft']) drone.x -= drone.speed;
    if (keys['ArrowRight']) drone.x += drone.speed;
    drone.x = Math.max(0, Math.min(W, drone.x));
    // Fire
    if (keys['Space'] && frame % 10 === 0) fireLaser();

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y < 0) lasers.splice(i, 1);
    }

    // Spawn asteroids
    if (frame % 60 === 0) spawnAsteroid();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with drone
      const dx = a.x + a.r - drone.x;
      const dy = a.y + a.r - drone.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(drone.w, drone.h) / 2) {
        drone.health -= a.damage;
        asteroids.splice(i, 1);
        if (drone.health <= 0) {
          playGameOverSound();
          gameOver = true;
          break;
        }
        continue;
      }
      // Collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        const withinX = l.x >= a.x && l.x <= a.x + a.r * 2;
        const withinY = l.y >= a.y && l.y <= a.y + a.r * 2;
        if (withinX && withinY) {
          playExplosionSound();
          score += a.r > 20 ? 10 : 20;
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }
      // Remove off‑screen
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }
    frame++;
  }

  function draw() {
    // Dark neon background with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Apply neon glow for subsequent drawing
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    // Drone with neon gradient
    const droneGrad = ctx.createLinearGradient(drone.x - drone.w / 2, drone.y - drone.h, drone.x + drone.w / 2, drone.y);
    droneGrad.addColorStop(0, '#0ff');
    droneGrad.addColorStop(1, '#0aa');
    ctx.fillStyle = droneGrad;
    ctx.beginPath();
    ctx.moveTo(drone.x - drone.w / 2, drone.y);
    ctx.lineTo(drone.x + drone.w / 2, drone.y);
    ctx.lineTo(drone.x, drone.y - drone.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Lasers with neon glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    lasers.forEach((l) => {
      ctx.fillRect(l.x - l.w / 2, l.y, l.w, l.h);
    });
    // Reset shadow for HUD
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // Asteroids with neon glow
    asteroids.forEach((a) => {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.2, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, a.color);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${drone.health}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click to restart', W / 2, H / 2 + 40);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', () => {
    if (!gameOver) return;
    // Reset state
    drone.x = W / 2;
    drone.health = 3;
    score = 0;
    asteroids.length = 0;
    lasers.length = 0;
    frame = 0;
    gameOver = false;
  });

  requestAnimationFrame(loop);
})();
