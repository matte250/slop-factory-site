// Asteroid Dodge game – targets canvas with id "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = canvas.offsetHeight);

  // Ship – simple right‑pointing triangle
  const ship = { x: 50, y: H / 2, size: 15, speed: 3 };

  // Input handling (WASD / Arrow keys)
  const keys = {};
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  window.addEventListener('keydown', e => {
    if (!keys[e.key]) {
      // play thrust sound on first press
      if (['ArrowUp','ArrowDown','w','s','ArrowLeft','ArrowRight','a','d'].includes(e.key))
        playTone(300, 0.05);
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids pool
  const asteroids = [];
  let spawnTimer = 0;
  let gameTime = 0; // seconds

  function update(dt) {
    // --- ship movement ---
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // optional horizontal boost (right arrow / d)
    if (keys.ArrowRight || keys.d) ship.x += ship.speed * 0.5;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed * 0.5;
    // wrap vertically
    if (ship.y < 0) ship.y = H;
    if (ship.y > H) ship.y = 0;
    // keep ship within horizontal bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x > W) ship.x = W;

    // --- asteroids ---
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const radius = 10 + Math.random() * 10;
      const speed = 2 + gameTime * 0.02; // gradually faster
      asteroids.push({ x: W + radius, y: Math.random() * H, r: radius, v: speed });
      spawnTimer = 0.8 - Math.min(0.6, gameTime * 0.01); // faster spawns
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.v;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      // collision (approximate with ship's tip)
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.size) endGame();
    }
    gameTime += dt;
  }

    let running = true;
    // generate static stars for background
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
    }
    function drawBackground() {
      // clear with dark space color
      ctx.fillStyle = '#000020';
      ctx.fillRect(0, 0, W, H);
      // draw stars
      ctx.fillStyle = 'white';
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  function endGame() {
    running = false;
    alert('Game over! You survived ' + Math.floor(gameTime) + ' seconds.');
  }

  function drawShip() {
    // ship with gradient fill and stroke
    const grad = ctx.createLinearGradient(ship.x - ship.size, ship.y - ship.size / 2, ship.x, ship.y + ship.size / 2);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#00f');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.size, ship.y - ship.size / 2);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function draw() {
    // draw background with stars
    drawBackground();
    // draw ship
    drawShip();
    // draw asteroids
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      // asteroid gradient
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw score
    ctx.fillStyle = 'yellow';
    ctx.font = '16px sans-serif';
    ctx.fillText('Time: ' + Math.floor(gameTime) + 's', 10, 20);
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
