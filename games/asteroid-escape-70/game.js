// Simple Asteroid Escape game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill its container
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const player = {
    w: 30,
    h: 30,
    x: canvas.width / 2 - 15,
    y: canvas.height - 40,
    speed: 4,
    color: '#0f0',
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // play a brief engine thrust sound when moving
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      playTone(200, 0.04);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // simple ambient background tone loop
  const bgInterval = setInterval(() => {
    // low, soft hum
    playTone(60, 0.08);
  }, 3000);
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size);
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, w: size, h: size, speed, color: '#a33' });
    // short low‑pitch blip for new asteroid
    playTone(120, 0.05);
  }

  function update(dt) {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y > canvas.height) asteroids.splice(i, 1);
    }

    // collision check
    for (const a of asteroids) {
        if (
          player.x < a.x + a.w &&
          player.x + player.w > a.x &&
          player.y < a.y + a.h &&
          player.y + player.h > a.y
        ) {
          gameOver = true;
          // collision sound – higher pitch
          playTone(300, 0.2);
          // stop background sound
          clearInterval(bgInterval);
          break;
        }

    }
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // optional starfield for depth
    ctx.fillStyle = '#222';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // player – draw as a sleek triangle ship
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(-player.w / 2, player.h / 2);
    ctx.lineTo(player.w / 2, player.h / 2);
    ctx.lineTo(0, -player.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids – radial gradient for a shiny look
    for (const a of asteroids) {
      const radial = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      radial.addColorStop(0, '#fff');
      radial.addColorStop(1, a.color);
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score overlay
    const now = performance.now();
    const seconds = ((now - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${seconds}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '28px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame;
  requestAnimationFrame(loop);
})();
