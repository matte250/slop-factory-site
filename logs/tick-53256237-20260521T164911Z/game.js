// Simple "Cosmic Dodger" game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/sound-effects/goal.wav');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play().catch(()=>{}); // ignore autoplay restrictions
  const hitSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/sound-effects/short-fail.wav');
  const spawnSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/sound-effects/coin.wav');
  const width = canvas.width;
  const height = canvas.height;

  // Ship configuration
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0ff',
  };

  // Meteor configuration
  const meteors = [];
  let meteorSpawnInterval = 2000; // ms, will drop
  let lastSpawn = 0;
  let meteorSpeed = 1.5; // initial fall speed, will increase

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Score (seconds survived)
  const startTime = performance.now();
  let gameOver = false;

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    // Clamp ship inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      const size = 20 + Math.random() * 30;
      meteors.push({
        x: Math.random() * (width - size),
        y: -size,
        w: size,
        h: size,
        speed: meteorSpeed + Math.random() * 1,
        color: '#f90',
      });
      spawnSound.currentTime = 0;
      spawnSound.play();
      lastSpawn = performance.now();
      // gradually increase difficulty
      meteorSpawnInterval = Math.max(300, meteorSpawnInterval * 0.97);
      meteorSpeed *= 1.01;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Check collision with ship
      if (
        m.x < ship.x + ship.w &&
        m.x + m.w > ship.x &&
        m.y < ship.y + ship.h &&
        m.y + m.h > ship.y
      ) {
        hitSound.currentTime = 0;
        hitSound.play();
        gameOver = true;
      }
      // Meteors that reach bottom also end game
      if (m.y > height) gameOver = true;
      // Remove off‑screen meteors
      if (m.y > height + m.h) meteors.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Ship (draw as triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Meteors (draw as circles with gradient)
    meteors.forEach(m => {
      const gradient = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, m.color);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    const secs = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${secs}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
