// Simple Space Collector game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // create background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect() { playTone(800, 0.08); }
  function playHit() { playTone(200, 0.2); }
  function playGameOver() { playTone(100, 0.5); }

  const ship = { x: canvas.width / 2, y: canvas.height - 60, r: 12, speed: 4 };
  const cells = [];
  const asteroids = [];
  const stars = [];
  let score = 0;
  let time = 60; // seconds
  let lastTimestamp = 0;
  let gameOver = false;

  // generate static star background
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 2 + 0.5 });
  }

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnCell() {
    cells.push({ x: Math.random() * canvas.width, y: -20, r: 8, speed: 2 + Math.random() * 1.5 });
  }
  function spawnAsteroid() {
    const size = 15 + Math.random() * 15;
    asteroids.push({ x: Math.random() * canvas.width, y: -size, r: size, speed: 2 + Math.random() * 2 });
  }

  let cellTimer = 0, asteroidTimer = 0;

  function update(delta) {
    if (gameOver) return;

    // timer
    time -= delta / 1000;
    if (time <= 0) endGame();

    // player movement (left/right)
    if (keys['ArrowLeft'] && ship.x - ship.r > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.r < canvas.width) ship.x += ship.speed;

    // spawn
    cellTimer += delta;
    asteroidTimer += delta;
    if (cellTimer > 1000) { spawnCell(); cellTimer = 0; }
    if (asteroidTimer > 2000) { spawnAsteroid(); asteroidTimer = 0; }

    // update cells
    for (let i = cells.length - 1; i >= 0; i--) {
      const c = cells[i];
      c.y += c.speed;
      // collision with ship
      const dx = c.x - ship.x, dy = c.y - ship.y;
      if (dx * dx + dy * dy < (c.r + ship.r) ** 2) {
        score++; // collect
        playCollect();
        cells.splice(i, 1);
        continue;
      }
      // remove off-screen
      if (c.y - c.r > canvas.height) cells.splice(i, 1);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.r + ship.r) ** 2) {
        endGame();
        return;
      }
      if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
    }
  }

  function draw() {
    // clear and background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars with twinkling effect
    stars.forEach(s => {
      // simple twinkle by varying opacity
      ctx.globalAlpha = 0.5 + 0.5 * Math.random();
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1.0;
    // ship as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    // pointy nose
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // cells
    ctx.fillStyle = '#ff0';
    cells.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, Math.floor(time))}`, canvas.width - 100, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function endGame() {
    gameOver = true;
  }

  function loop(timestamp) {
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
