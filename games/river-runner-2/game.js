// Simple River Runner game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio context and simple tone player
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Game objects
  const boat = { x: WIDTH / 2, y: HEIGHT - 60, w: 40, h: 20, speed: 4 };
  const water = { level: 0, riseSpeed: 0.2 };
  const crates = [];
  const obstacles = [];

  let score = 0;
  let keys = {};
  let lastTime = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Ensure audio context is resumed on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnCrate() {
    const size = 15 + Math.random() * 10;
    crates.push({ x: Math.random() * (WIDTH - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 1 });
  }
  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    const type = Math.random() < 0.5 ? 'rock' : 'log';
    obstacles.push({ x: Math.random() * (WIDTH - size), y: -size, w: size, h: size, speed: 2.5 + Math.random() * 1.5, type });
  }

  // Simple rectangle collision
  function collides(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // Boat movement
    if (keys['ArrowLeft'] && boat.x > 0) boat.x -= boat.speed;
    if (keys['ArrowRight'] && boat.x + boat.w < WIDTH) boat.x += boat.speed;

    // Move crates & obstacles
    crates.forEach(c => c.y += c.speed);
    obstacles.forEach(o => o.y += o.speed);

    // Remove off-screen items
    while (crates.length && crates[0].y > HEIGHT) crates.shift();
    while (obstacles.length && obstacles[0].y > HEIGHT) obstacles.shift();

    // Water rise
    water.level += water.riseSpeed * dt / 16; // scale to ms

    // Collision detection
    for (let i = crates.length - 1; i >= 0; i--) {
      if (collides(boat, crates[i])) {
        score++;
        crates.splice(i, 1);
        // Play collection sound
        playTone(800, 0.1);
      }
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (collides(boat, obstacles[i])) {
        gameOver();
        return;
      }
    }
    if (water.level > boat.y) {
      gameOver();
      return;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // River background with gradient
    const riverGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    riverGrad.addColorStop(0, '#88ccee');
    riverGrad.addColorStop(1, '#5599bb');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Water level overlay
    ctx.fillStyle = '#003366';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, HEIGHT - water.level, WIDTH, water.level);
    ctx.globalAlpha = 1;
    // Boat (simple hull with sail)
    ctx.fillStyle = '#006600';
    // hull
    ctx.fillRect(boat.x, boat.y + boat.h/2, boat.w, boat.h/2);
    // sail
    ctx.beginPath();
    ctx.moveTo(boat.x + boat.w/2, boat.y);
    ctx.lineTo(boat.x + boat.w/2, boat.y + boat.h/2);
    ctx.lineTo(boat.x + boat.w/2 + boat.w/4, boat.y + boat.h/2);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Crates
    ctx.fillStyle = '#ffd700';
    crates.forEach(c => ctx.fillRect(c.x, c.y, c.w, c.h));
    // Obstacles
    ctx.fillStyle = '#555555';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  let gameRunning = true;
  function gameOver() {
    gameRunning = false;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.fillText('Score: ' + score, WIDTH / 2, HEIGHT / 2 + 20);
  }

  // Main loop
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (gameRunning) {
      if (Math.random() < 0.02) spawnCrate();
      if (Math.random() < 0.015) spawnObstacle();
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
