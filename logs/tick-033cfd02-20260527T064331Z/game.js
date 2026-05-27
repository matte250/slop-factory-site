// Orbit Dodge game
// Canvas with id="game" must exist in the HTML.
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Audio context and simple sound helpers
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.1); }
  function playCollision() { playTone(100, 0.4); }

  const planet = { x: W / 2, y: H / 2, r: 30 };
  const ship = { angle: 0, r: planet.r + 20, speedR: 0, rotSpeed: 0.03, thrust: 0 };
  const drones = [];
  let gameOver = false;

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnDrone() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    if (side === 0) { // left
      x = -20; y = Math.random() * H; vx = speed; vy = (Math.random() - 0.5) * speed;
    } else if (side === 1) { // right
      x = W + 20; y = Math.random() * H; vx = -speed; vy = (Math.random() - 0.5) * speed;
    } else if (side === 2) { // top
      x = Math.random() * W; y = -20; vx = (Math.random() - 0.5) * speed; vy = speed;
    } else { // bottom
      x = Math.random() * W; y = H + 20; vx = (Math.random() - 0.5) * speed; vy = -speed;
    }
    drones.push({ x, y, vx, vy, r: 10 });
  }

  function update() {
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotSpeed;
    const thrusting = keys['ArrowUp'];
    if (thrusting) ship.thrust = 0.5; else ship.thrust = 0;
    ship.speedR += ship.thrust - 0.02 * ship.speedR; // simple drag
    ship.r += ship.speedR;
    if (ship.r < planet.r + 10) ship.r = planet.r + 10;
    if (ship.r > Math.min(W, H) / 2 - 10) ship.r = Math.min(W, H) / 2 - 10;
    // play thrust sound when thrusting
    if (thrusting) {
      // ensure audio context is resumed on interaction
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playThrust();
    }

    // move drones
    for (let d of drones) {
      d.x += d.vx; d.y += d.vy;
    }
    // remove off‑screen drones
    for (let i = drones.length - 1; i >= 0; i--) {
      const d = drones[i];
      if (d.x < -30 || d.x > W + 30 || d.y < -30 || d.y > H + 30) drones.splice(i, 1);
    }

    // collisions
    const shipX = planet.x + Math.cos(ship.angle) * ship.r;
    const shipY = planet.y + Math.sin(ship.angle) * ship.r;
    const distToPlanet = Math.hypot(shipX - planet.x, shipY - planet.y);
    if (distToPlanet < planet.r + 5) {
      if (!gameOver) playCollision();
      gameOver = true;
    }
    for (const d of drones) {
      if (Math.hypot(shipX - d.x, shipY - d.y) < d.r + 5) {
        if (!gameOver) playCollision();
        gameOver = true;
        break;
      }
    }

    // draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // planet with gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x, planet.y, planet.r * 0.3,
      planet.x, planet.y, planet.r
    );
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath(); ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2); ctx.fill();
    // ship as triangle
    const shipX = planet.x + Math.cos(ship.angle) * ship.r;
    const shipY = planet.y + Math.sin(ship.angle) * ship.r;
    const shipSize = 8;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(
      shipX + Math.cos(ship.angle) * shipSize,
      shipY + Math.sin(ship.angle) * shipSize
    );
    ctx.lineTo(
      shipX + Math.cos(ship.angle + Math.PI * 0.8) * shipSize,
      shipY + Math.sin(ship.angle + Math.PI * 0.8) * shipSize
    );
    ctx.lineTo(
      shipX + Math.cos(ship.angle - Math.PI * 0.8) * shipSize,
      shipY + Math.sin(ship.angle - Math.PI * 0.8) * shipSize
    );
    ctx.closePath();
    ctx.fill();
    // drones with subtle gradient
    for (const d of drones) {
      const grad = ctx.createRadialGradient(d.x, d.y, d.r * 0.3, d.x, d.y, d.r);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      if (Math.random() < 0.02) spawnDrone();
      update();
      requestAnimationFrame(loop);
    } else {
      update(); // final draw
    }
  }
  loop();
})();
