// Simple Asteroid Courier game
// Canvas element with id="game" must exist in the HTML

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  const playTone = (freq, dur = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  };

  const playCollision = () => playTone(120, 0.4, 'sawtooth');
  const playDelivery = () => playTone(440, 0.2, 'triangle');
  const playAsteroid = () => playTone(200, 0.05, 'square');

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Resize to fill window
  const generateStars = (count = 200) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
      });
    }
    return arr;
  };
  let stars = [];
  const initStars = () => stars = generateStars();
  const drawBackground = () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  window.addEventListener('resize', () => {
    resize();
    initStars();
  });
  // initial starfield
  initStars();
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game parameters
  let level = 1;
  let speed = 2; // ship speed per frame
  let asteroidRate = 60; // frames between new asteroids
  let asteroidTimer = 0;
  const deliveryRadius = 30; // distance to beacon for delivery
  const shipSize = 15;
  const beaconSize = 20;
  const maxTimer = 15; // seconds per delivery

  // State
  const ship = { x: 100, y: 100, vx: 0, vy: 0, delivered: false };
  const beacon = { x: 0, y: 0, angle: 0 };
  const asteroids = [];
  let deliveryTime = maxTimer;

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const updateBeacon = () => {
    // Move beacon along a circular path
    beacon.angle += 0.01 * level;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    beacon.x = canvas.width / 2 + Math.cos(beacon.angle) * radius;
    beacon.y = canvas.height / 2 + Math.sin(beacon.angle) * radius;
  };

  const spawnAsteroid = () => {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speedRange = 0.5 + 0.3 * level;
    switch (side) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -20;
        vx = (Math.random() - 0.5) * speedRange;
        vy = Math.random() * speedRange + 0.5;
        break;
      case 1: // right
        x = canvas.width + 20;
        y = Math.random() * canvas.height;
        vx = -Math.random() * speedRange - 0.5;
        vy = (Math.random() - 0.5) * speedRange;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 20;
        vx = (Math.random() - 0.5) * speedRange;
        vy = -Math.random() * speedRange - 0.5;
        break;
      case 3: // left
        x = -20;
        y = Math.random() * canvas.height;
        vx = Math.random() * speedRange + 0.5;
        vy = (Math.random() - 0.5) * speedRange;
        break;
    }
    const radius = 10 + Math.random() * 15;
    const angle = Math.random() * Math.PI * 2;
    const angularVel = (Math.random() - 0.5) * 0.02;
    asteroids.push({ x, y, vx, vy, r: radius, angle, angularVel });
    playAsteroid();
  };

  const updateShip = () => {
    let dx = 0, dy = 0;
    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      ship.vx = (dx / len) * speed;
      ship.vy = (dy / len) * speed;
    } else {
      ship.vx = 0; ship.vy = 0;
    }
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep ship in bounds
    ship.x = Math.max(0, Math.min(canvas.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));
  };

  const updateAsteroids = () => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove off‑screen asteroids
      if (a.x < -30 || a.x > canvas.width + 30 || a.y < -30 || a.y > canvas.height + 30) {
        asteroids.splice(i, 1);
      }
    }
  };

  const checkCollisions = () => {
    // Ship vs asteroids
    for (const a of asteroids) {
      const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (dist < a.r + shipSize) {
        playCollision();
        endGame('Crashed into an asteroid');
        return true;
      }
    }
    // Delivery check
    const d = Math.hypot(ship.x - beacon.x, ship.y - beacon.y);
    if (d < deliveryRadius) {
      playDelivery();
      level++;
      speed += 0.5;
      asteroidRate = Math.max(10, asteroidRate - 5);
      deliveryTime = maxTimer;
      // Reset ship position
      ship.x = 100; ship.y = 100;
      // Clear asteroids
      asteroids.length = 0;
    }
    return false;
  };

  let gameOver = false;
  const endGame = (msg) => {
    gameOver = true;
    alert(msg + '\nFinal level: ' + level);
  };

  // Ship trail positions
  const trail = [];
  const maxTrail = 20;

  const drawShip = () => {
    // Add current position to trail
    trail.push({ x: ship.x, y: ship.y });
    if (trail.length > maxTrail) trail.shift();

    // Draw trail fade
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const alpha = i / trail.length;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, shipSize * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#0ff';
      ctx.fill();
    }
    ctx.restore();

    // Draw ship with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const angle = Math.atan2(ship.vy, ship.vx) || 0;
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(-shipSize, -shipSize, shipSize, shipSize);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(shipSize, 0);
    ctx.lineTo(-shipSize, shipSize / 2);
    ctx.lineTo(-shipSize, -shipSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawBeacon = () => {
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, beaconSize, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0';
    ctx.fill();
  };

  const drawAsteroids = () => {
    for (const a of asteroids) {
      // Update rotation
      a.angle += a.angularVel;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      // Gradient for asteroid
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawHUD = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Level: ' + level, 10, 20);
    ctx.fillText('Time: ' + deliveryTime.toFixed(1), 10, 40);
  };

  const loop = () => {
    if (gameOver) return;
    drawBackground();
    updateBeacon();
    updateShip();
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidRate;
    } else {
      asteroidTimer--;
    }
    updateAsteroids();
    if (checkCollisions()) return;
    drawBeacon();
    drawShip();
    drawAsteroids();
    drawHUD();
    // timer countdown
    deliveryTime -= 1 / 60;
    if (deliveryTime <= 0) endGame('Delivery timer expired');
    requestAnimationFrame(loop);
  };

  // start game loop
  requestAnimationFrame(loop);
})();
