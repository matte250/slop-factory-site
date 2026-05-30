// Asteroid Dodge game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // No canvas found
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.width || 800);
  const H = (canvas.height = canvas.height || 600);

  // Generate starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + 0.5 });
  }

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let musicStarted = false;
  function startMusic() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 30; // low hum
    gain.gain.value = 0.02;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    // keep oscillator running
    musicStarted = true;
    // store to stop later if needed
    window._bgOsc = osc;
  }
  function playCollision() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  // Resume audio on first interaction
  function ensureAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!musicStarted) startMusic();
  }


  // Player ship (drawn as triangle)
  const ship = { w: 40, h: 20, x: W / 2 - 20, y: H - 30, speed: 5 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; ensureAudio(); });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  let asteroidInterval = 90; // frames
  let asteroidSpeed = 2;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (W - radius * 2) + radius;
    asteroids.push({ x, y: -radius, r: radius, speed: asteroidSpeed });
  }

  function update() {
    // Move stars (parallax)
    for (const s of stars) {
      s.y += 0.5; // star speed
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    }
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // Spawn asteroids
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = asteroidInterval;
      // Gradually increase difficulty
      if (asteroidInterval > 30) asteroidInterval -= 0.5;
      asteroidSpeed += 0.01;
    } else spawnTimer--;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.r > H) asteroids.splice(i, 1);
      // Collision with ship (circle‑rect)
      const cx = a.x, cy = a.y, r = a.r;
      const rx = ship.x, ry = ship.y, rw = ship.w, rh = ship.h;
      const closestX = Math.max(rx, Math.min(cx, rx + rw));
      const closestY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - closestX, dy = cy - closestY;
      if (dx * dx + dy * dy < r * r) {
        playCollision();
        gameOver = true;
        // Stop background music
        if (window._bgOsc) {
          window._bgOsc.stop();
        }
      }
    }
    score++;
  }

  function draw() {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0d001a');
    bgGrad.addColorStop(1, '#1a001f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score (neon style)
    ctx.fillStyle = '#0ff';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 24);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
