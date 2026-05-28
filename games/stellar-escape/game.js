// Stellar Escape – simple canvas game with improved graphics
// Ship (controlled with arrow keys) must dodge randomly spawning asteroids.
// The canvas element is expected in the HTML with id="game".

  (() => {
   const canvas = document.getElementById('game');
   if (!canvas) {
     console.error('Canvas with id "game" not found');
     return;
   }
   const ctx = canvas.getContext('2d');
   const width = canvas.width;
   const height = canvas.height;

   // Audio setup
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   function playSound(freq, duration) {
     const osc = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     osc.frequency.value = freq;
     osc.type = 'sine';
     osc.connect(gain);
     gain.connect(audioCtx.destination);
     gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
     osc.start();
     setTimeout(() => {
       gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.01);
       osc.stop(audioCtx.currentTime + 0.02);
     }, duration);
   }

   // ----- Starfield background -----
   const starCount = 80;
   const stars = [];
   for (let i = 0; i < starCount; i++) {
     stars.push({
       x: Math.random() * width,
       y: Math.random() * height,
       radius: Math.random() * 1.5 + 0.5,
     });
   }
   function drawStars() {
     // dark space background
     ctx.fillStyle = '#111';
     ctx.fillRect(0, 0, width, height);
     ctx.fillStyle = '#fff';
     stars.forEach(s => {
       ctx.beginPath();
       ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
       ctx.fill();
     });
   }

   function updateStars(dt) {
     const speed = 0.02; // pixels per millisecond
     for (let i = stars.length - 1; i >= 0; i--) {
       const s = stars[i];
       s.y += speed * dt;
       if (s.y > height) {
         s.y = 0;
         s.x = Math.random() * width;
       }
     }
   }

  // ----- Player ship -----
  const ship = {
    x: width / 2,
    y: height - 30,
    size: 20,
    speed: 4,
    color: '#0ff',
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function moveShip() {
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep within bounds
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y));
  }

  function drawShip() {
    // Ship with gradient fill and white outline
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.size, ship.x, ship.y + ship.size);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#005555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // draw thruster flame when moving
    if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.size);
      ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size + 10);
      ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size + 10);
      ctx.closePath();
      ctx.fill();
      // sound for thruster
      playSound(180, 80);
    }
  }

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidSpawnRate = 1500; // ms
  const asteroidMinSize = 15;
  const asteroidMaxSize = 40;
  const asteroidSpeed = 2;

  function spawnAsteroid() {
    const size = Math.random() * (asteroidMaxSize - asteroidMinSize) + asteroidMinSize;
    const x = Math.random() * (width - size * 2) + size;
    const y = -size;
    const vx = (Math.random() - 0.5) * 0.5; // slight horizontal drift
    const vy = asteroidSpeed + Math.random();
    asteroids.push({ x, y, size, vx, vy, color: '#888' });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // remove if off screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    // Asteroids with radial gradient and subtle outline
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  // ----- Collision -----
  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.size) return true;
    }
    return false;
  }

  // ----- Game loop -----
  let lastTime = performance.now();
  let elapsed = 0;
  let gameOver = false;

  function loop(now) {
    const rawDelta = now - lastTime;
    const dt = rawDelta / 16; // normalize to ~60fps steps for asteroids
    lastTime = now;
    if (gameOver) {
      // draw final state
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText(`Survived: ${(elapsed / 1000).toFixed(1)}s`, width / 2 - 80, height / 2 + 30);
      return;
    }
    elapsed += now - lastTime;

    updateStars(dt);
    drawStars();
    moveShip();
    drawShip();
    updateAsteroids(dt);
    drawAsteroids();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${(elapsed / 1000).toFixed(1)}s`, 10, 20);

    if (checkCollision()) {
      gameOver = true;
    }

    requestAnimationFrame(loop);
  }

  // start spawning asteroids
  const spawnInterval = setInterval(spawnAsteroid, asteroidSpawnRate);
  // start loop
  requestAnimationFrame(loop);
})();
