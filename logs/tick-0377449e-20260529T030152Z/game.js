// Simple Asteroid Dodger game with enhanced graphics
// Canvas id="game" must exist in the HTML

(() => {
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   const playBeep = (freq, duration) => {
    // simple beep sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // engine sound handling
  let engineOsc = null;
  const startEngine = () => {
    if (engineOsc) return;
    engineOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    engineOsc.frequency.value = 120;
    engineOsc.type = 'square';
    engineOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
    engineOsc.start();
  };
  const stopEngine = () => {
    if (!engineOsc) return;
    const gain = audioCtx.createGain();
    engineOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    engineOsc.stop(audioCtx.currentTime + 0.05);
    engineOsc.disconnect();
    engineOsc = null;
  };
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
   const ctx = canvas.getContext('2d');
   // starfield will be initialized after canvas size is known
   let stars = [];
   const initStars = () => {
     stars = Array.from({length: 100}, () => ({
       x: Math.random() * width,
       y: Math.random() * height,
       size: Math.random() * 2 + 1,
     }));
   };
  const width = canvas.width = canvas.clientWidth || 400;
   const height = canvas.height = canvas.clientHeight || 600;
  // Initialize starfield now that dimensions are set
  initStars();
  const starSpeed = 0.5; // pixels per frame

  // Ship (triangle) centered at bottom
  const ship = { x: width / 2, y: height - 30, w: 20, h: 30, speed: 5 };

  const asteroids = [];
  let spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let lastTime = 0;
  let gameOver = false;
  let difficultyTimer = 0;

  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    // stop engine sound when no movement keys are pressed
    if (!keys['ArrowLeft'] && !keys['a'] && !keys['ArrowRight'] && !keys['d']) stopEngine();
  });

  function spawnAsteroid() {
    // sound for new asteroid
    playBeep(150, 0.05);
    const size = Math.random() * 30 + 15;
    const x = Math.random() * (width - size);
    const speed = Math.random() * 2 + 1 + difficultyTimer / 20000; // increase speed over time
    asteroids.push({ x, y: -size, size, speed });
  }

  function update(dt) {
    // ship movement
    const movingLeft = keys['ArrowLeft'] || keys['a'];
    const movingRight = keys['ArrowRight'] || keys['d'];
    if (movingLeft) ship.x -= ship.speed;
    if (movingRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    // engine sound when moving
    if (movingLeft || movingRight) startEngine();
    else stopEngine();

    // spawn asteroids
    if (lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = 0;
      // gradually accelerate spawning
      if (spawnInterval > 400) spawnInterval -= 20;
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // difficulty increase over time
    difficultyTimer += dt;
  }

  function drawShip() {
    // ship with gradient
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.h, ship.x + ship.w, ship.y);
    grad.addColorStop(0, '#00ff00');
    grad.addColorStop(1, '#006400');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.closePath();
    ctx.fill();
  }

  function drawBackground() {
    // dark space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  function drawStars() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#d2926e');
      grad.addColorStop(1, '#8b4513');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      // simple AABB‑circle collision
      const cx = a.x + a.size / 2;
      const cy = a.y + a.size / 2;
      const radius = a.size / 2;
      const closestX = Math.max(ship.x, Math.min(cx, ship.x + ship.w));
      const closestY = Math.max(ship.y - ship.h, Math.min(cy, ship.y));
      const dx = cx - closestX;
      const dy = cy - closestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
    return false;
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) return;

    lastSpawn += dt;
    update(dt);

    drawBackground();
    drawStars();
    drawShip();
    drawAsteroids();

    if (checkCollision()) {
      // collision sound
      playBeep(80, 0.3);
      gameOver = true;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
