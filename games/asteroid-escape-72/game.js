// Simple Asteroid Escape game – draws on <canvas id="game"></canvas>
// Improved graphics: starfield background, ship thrust flame, colorful asteroids

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ----- Input handling & audio -----
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return; // already playing
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
      keys[e.key] = true;
      if (e.key === 'ArrowUp') startThrustSound();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
      keys[e.key] = false;
      if (e.key === 'ArrowUp') stopThrustSound();
    }
  });

  // ----- Ship -----
  const ship = {
    x: width / 4,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotSpeed: 0.05,
  };

  function updateShip() {
    if (keys.ArrowLeft) ship.angle -= ship.rotSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    // outline for ship
    ctx.strokeStyle = 'lightgray';
    ctx.lineWidth = 1;
    ctx.stroke();
    // thrust flame when accelerating
    if (keys.ArrowUp) {
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-18, 6);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  // ----- Asteroids & Stars -----
  const asteroids = [];
  let asteroidTimer = 0;
  const spawnInterval = 120; // frames (~2s at 60fps)

  // starfield background
  const starCount = Math.floor((width * height) / 8000);
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.2 + Math.random() * 0.3,
    });
  }

  function updateStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width + s.radius;
        s.y = Math.random() * height;
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }


  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    const speed = 1 + Math.random() * 2;
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 50%)`;
    const angle = 0;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // slight rotation
    asteroids.push({
      x: width + radius,
      y: Math.random() * height,
      vx: -speed,
      radius,
      color,
      angle,
      rotSpeed,
    });
  }

  function updateAsteroids() {
    // move and rotate asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.angle += a.rotSpeed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = spawnInterval;
    } else {
      asteroidTimer--;
    }
  }

  function drawAsteroids() {
    asteroids.forEach((a) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ----- Collision / Game Over -----
  let gameOver = false;
  let frames = 0;

  function checkCollisions() {
    // ship vs asteroids
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) return true;
    }
    // off‑screen
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) return true;
    return false;
  }

  function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(frames / 60)}`, 10, 20);
  }

  // ----- Main loop -----
  function loop() {
    if (gameOver) return;
    // black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // background stars
    updateStars();
    drawStars();
    // game objects
    updateShip();
    updateAsteroids();
    drawShip();
    drawAsteroids();
    drawScore();
    if (checkCollisions()) {
      playCollisionSound();
      gameOver = true;
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    frames++;
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
