// Simple Canvas Dodger game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player square
  const player = {
    size: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 5,
    health: 3,
    color: '#0f0',
  };

  // Falling objects (enemies and power‑ups)
  const objects = [];
  const spawnInterval = 1000; // ms
  const powerUpChance = 0.1; // 10% are power‑ups

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Resume audio on first user interaction (required by browsers)
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  function spawnObject() {
    const radius = 15;
    const isPowerUp = Math.random() < powerUpChance;
    objects.push({
      x: Math.random() * (width - radius * 2),
      y: -radius,
      radius,
      speed: 2 + Math.random() * 2,
      isPowerUp,
      color: isPowerUp ? '#ff0' : '#f00',
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update() {
    // Move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // Update objects
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.y += obj.speed;
      // Collision with player
      const px = player.x + player.size / 2;
      const py = player.y + player.size / 2;
      const dx = obj.x + obj.radius - px;
      const dy = obj.y + obj.radius - py;
      const dist = Math.hypot(dx, dy);
        if (dist < obj.radius + player.size / 2) {
          if (obj.isPowerUp) {
            player.health = Math.min(5, player.health + 1);
            playTone(800); // power‑up tone
          } else {
            player.health -= 1;
            playTone(300); // hit tone
          }
          objects.splice(i, 1);
          continue;
        }
      // Remove off‑screen
      if (obj.y - obj.radius > height) objects.splice(i, 1);
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // player with gradient
    const pGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.size, player.y + player.size);
    pGrad.addColorStop(0, '#0f0');
    pGrad.addColorStop(1, '#050');
    ctx.fillStyle = pGrad;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // draw objects with radial gradient
    objects.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.radius, o.y + o.radius, o.radius * 0.2,
                                            o.x + o.radius, o.y + o.radius, o.radius);
      grad.addColorStop(0, o.isPowerUp ? '#ff0' : '#f88');
      grad.addColorStop(1, o.isPowerUp ? '#c00' : '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.radius, o.y + o.radius, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // health display with shadow
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText('Health: ' + player.health, 10, 20);
    ctx.shadowBlur = 0;
  }

  function loop() {
    update();
    draw();
    if (player.health > 0) {
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
      playTone(150, 0.5); // game over tone
    }
  }

  // Start game
  setInterval(spawnObject, spawnInterval);
  requestAnimationFrame(loop);
})();
