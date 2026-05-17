// Minimal Orbit Escape game targeting <canvas id="game"></canvas>
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playSound(freq, duration) {
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
  function startThrustSound() {
    if (thrustOsc) return;
    audioCtx.resume();
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 150;
    thrustOsc.type = 'square';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 0.02);
    thrustOsc.start();
    thrustOsc._gainNode = gain;
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    const gain = thrustOsc._gainNode;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    thrustOsc.stop(audioCtx.currentTime + 0.06);
    thrustOsc = null;
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ship state
  const ship = {x: W/2, y: H-50, angle: -Math.PI/2, vx: 0, vy: 0, radius: 10};
  const thrust = 0.1;
  const turnSpeed = 0.07;

  // asteroids rotating around center
  const asteroids = [];
  const AST_COUNT = 12;
  const AST_RADIUS = 15;
  const CENTER = {x: W/2, y: H/2};
  const ROT_SPEED = 0.0015; // radians per ms

  // generate static starfield background
  const stars = [];
  const STAR_COUNT = 200;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({x: Math.random() * W, y: Math.random() * H, radius: Math.random() * 1.5 + 0.5});
  }

  for (let i = 0; i < AST_COUNT; i++) {
    const angle = (i / AST_COUNT) * Math.PI * 2;
    const dist = 150 + Math.random() * 100;
    asteroids.push({angle, dist, radius: AST_RADIUS});
  }

  const safeZone = {x: CENTER.x, y: CENTER.y, radius: 30};

  let keys = {};
  const setKey = (e, down) => {keys[e.code] = down; e.preventDefault();};
  window.addEventListener('keydown', e => setKey(e, true));
  window.addEventListener('keyup', e => setKey(e, false));

  let last = performance.now();
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    // ship control
    if (keys['ArrowLeft']) ship.angle -= turnSpeed * dt;
    if (keys['ArrowRight']) ship.angle += turnSpeed * dt;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * thrust * dt;
      ship.vy += Math.sin(ship.angle) * thrust * dt;
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // motion
    ship.x += ship.vx * dt/16; // normalize to ~60fps base
    ship.y += ship.vy * dt/16;
    // simple drag
    ship.vx *= 0.99; ship.vy *= 0.99;
    // bounds check
    if (ship.x < -ship.radius || ship.x > W + ship.radius || ship.y < -ship.radius || ship.y > H + ship.radius) {
      playSound(80, 0.4); // crash
      endGame();
    }
    // rotate asteroids
    asteroids.forEach(a => a.angle += ROT_SPEED * dt);
    // collision
    for (let a of asteroids) {
      const ax = CENTER.x + Math.cos(a.angle) * a.dist;
      const ay = CENTER.y + Math.sin(a.angle) * a.dist;
      const dx = ship.x - ax, dy = ship.y - ay;
      if (Math.hypot(dx, dy) < ship.radius + a.radius) {
        playSound(80, 0.4);
        endGame();
        break;
      }
    }
    // win check
    const dSafe = Math.hypot(ship.x - safeZone.x, ship.y - safeZone.y);
    if (dSafe < safeZone.radius) {
      gameOver = true;
      playSound(440, 0.5); // success tone
      alert('You escaped!');
    }
  }

  function draw() {
    // background gradient (dark space to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0d001a');
    bgGrad.addColorStop(1, '#001a33');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // safe zone with subtle glow
    ctx.beginPath();
    ctx.arc(safeZone.x, safeZone.y, safeZone.radius, 0, Math.PI * 2);
    const safeGrad = ctx.createRadialGradient(safeZone.x, safeZone.y, 0, safeZone.x, safeZone.y, safeZone.radius);
    safeGrad.addColorStop(0, 'rgba(0,255,0,0.4)');
    safeGrad.addColorStop(1, 'rgba(0,255,0,0)');
    ctx.fillStyle = safeGrad;
    ctx.fill();

    // asteroids with radial gradient for depth
    asteroids.forEach(a => {
      const ax = CENTER.x + Math.cos(a.angle) * a.dist;
      const ay = CENTER.y + Math.sin(a.angle) * a.dist;
      const grad = ctx.createRadialGradient(ax, ay, a.radius * 0.2, ax, ay, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.beginPath();
      ctx.arc(ax, ay, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // ship with simple thrust glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body gradient
    const shipGrad = ctx.createLinearGradient(-12, 0, 12, 0);
    shipGrad.addColorStop(0, '#bbb');
    shipGrad.addColorStop(1, '#fff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(12,0);
    ctx.lineTo(-8,-7);
    ctx.lineTo(-8,7);
    ctx.closePath();
    ctx.fill();
    // thrust particles if accelerating
    if (keys['ArrowUp']) {
      ctx.fillStyle = 'orange';
      for (let i = 0; i < 5; i++) {
        const off = Math.random() * 4 + 6;
        ctx.beginPath();
        ctx.arc(-off, (Math.random()-0.5)*4, Math.random()*1.5, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.restore();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over - Click to Restart', W/2, H/2);
    }
  }

  function loop(ts) {
    const dt = ts - last;
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function endGame() {
    gameOver = true;
    alert('Game Over');
  }

  canvas.addEventListener('click', () => {
    if (!gameOver) return;
    // reset state
    ship.x = W/2; ship.y = H-50; ship.angle = -Math.PI/2; ship.vx = 0; ship.vy = 0;
    gameOver = false;
  });

  requestAnimationFrame(loop);
})();
