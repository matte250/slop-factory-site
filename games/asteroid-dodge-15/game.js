// Asteroid Dodge game
// Canvas with id="game" (assumed present in HTML)
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill the window (fallback to existing size)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = {
    width: 40,
    height: 30,
    x: canvas.width / 2 - 20,
    y: canvas.height - 50,
    speed: 5,
    color: '#0f0',
  };

  const keys = {};
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 200; // low pitch
    thrustOsc.type = 'sawtooth';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playSpawnSound() {
    playBeep(400, 80);
  }
  function playCollisionSound() {
    // low descending beep
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') startThrustSound();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'ArrowUp') stopThrustSound();
  });

  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let gameOver = false;

  function update(dt) {
    // Move ship based on arrow keys
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));

    // Update stars (scroll down)
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      lastSpawn = performance.now();
      const size = Math.random() * 30 + 20;
      asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        size,
        speed: Math.random() * 2 + 1,
        color: '#a52a2a',
      });
      playSpawnSound(); // sound effect for new asteroid
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove if off screen
      if (a.y > canvas.height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const shipRect = {
        x: ship.x,
        y: ship.y,
        w: ship.width,
        h: ship.height,
      };
      const asteroidRect = {
        x: a.x,
        y: a.y,
        w: a.size,
        h: a.size,
      };
      if (
        shipRect.x < asteroidRect.x + asteroidRect.w &&
        shipRect.x + shipRect.w > asteroidRect.x &&
        shipRect.y < asteroidRect.y + asteroidRect.h &&
        shipRect.y + shipRect.h > asteroidRect.y
      ) {
        playCollisionSound();
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Clear background with vertical gradient for depth
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d'); // dark blue top
    bgGrad.addColorStop(1, '#000000'); // black bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars with twinkling effect
    for (const s of stars) {
      const alpha = 0.5 + Math.random() * 0.5; // 0.5-1 opacity
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Draw ship with gradient and outline
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.height);
    shipGrad.addColorStop(0, '#00ff00');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.strokeStyle = '#00aa00';
    ctx.lineWidth = 2;
    ctx.stroke();
    // thrust flame when moving up
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.width / 2, ship.y + ship.height);
      ctx.lineTo(ship.x + ship.width / 2 - 5, ship.y + ship.height + 15);
      ctx.lineTo(ship.x + ship.width / 2 + 5, ship.y + ship.height + 15);
      ctx.closePath();
      ctx.fill();
    }

    // Draw asteroids with radial gradient and subtle rotation
    for (const a of asteroids) {
      ctx.save();
      const cx = a.x + a.size / 2;
      const cy = a.y + a.size / 2;
      ctx.translate(cx, cy);
      const rot = (Math.random() - 0.5) * 0.2; // +/-0.1 rad
      ctx.rotate(rot);
      const grad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size / 2);
      grad.addColorStop(0, '#b5651d');
      grad.addColorStop(1, '#4b2e0a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
