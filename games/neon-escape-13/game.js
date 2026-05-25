// Minimal Neon Escape endless runner
// Canvas must exist with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Simple sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30; // low freq hum
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 40,
    h: 20,
    speed: 5,
    color: '#0ff',
  };

  const keys = { ArrowLeft: false, ArrowRight: false };
  // Ensure audio context runs after user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 90; // frames
  let speed = 2; // base asteroid speed
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, size, speed: speed + Math.random() * 1.5 });
    // subtle spawn sound
    playTone(150, 0.05);
  }

  function update() {
    if (gameOver) return;
    // move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // spawn asteroids
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    } else spawnTimer--;

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // collision detection
    for (const a of asteroids) {
      const dx = (ship.x + ship.w / 2) - (a.x + a.size / 2);
      const dy = (ship.y + ship.h / 2) - (a.y + a.size / 2);
      const dist = Math.hypot(dx, dy);
        if (dist < a.size / 2 + Math.max(ship.w, ship.h) / 2) {
        // collision sound
        playTone(80, 0.2);
        gameOver = true;
        break;
      }
    }

    // increase difficulty gradually
    if (frame % 600 === 0 && spawnInterval > 30) spawnInterval -= 5;
    if (frame % 300 === 0) speed += 0.2;

    score = Math.floor(frame / 60);
    frame++;
  }

  function draw() {
    // neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // starfield with twinkling effect
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const brightness = Math.random() * 0.6 + 0.4;
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // ship with neon triangle and glow
    ctx.save();
    ctx.shadowColor = ship.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2, a.y + a.size / 2, a.size * 0.1,
        a.x + a.size / 2, a.y + a.size / 2, a.size / 2
      );
      grad.addColorStop(0, '#ff6655');
      grad.addColorStop(1, '#aa3300');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);

    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '40px monospace';
      ctx.fillText('Game Over', width / 2 - 100, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
