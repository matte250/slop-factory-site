// Cosmic Dodge game implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playStarSound() { playTone(800, 0.1); }
  function playCollisionSound() { playTone(200, 0.4); }

  // Player ship
  const ship = { w: 30, h: 40, x: width / 2, y: height - 50, speed: 5 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume AudioContext on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Game objects
  const asteroids = [];
  const stars = [];
  const bgStars = [];
  // generate static background stars
  for (let i = 0; i < 100; i++) {
    bgStars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  let asteroidTimer = 0;
  let starTimer = 0;
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 2 + score / 10000; // gradual speed increase
    const angle = Math.random() * 360; // initial rotation angle
    asteroids.push({ x, y: -size, size, speed, angle });
  }

  function spawnStar() {
    const size = 8;
    const x = Math.random() * (width - size);
    const speed = 1.5;
    stars.push({ x, y: -size, size, speed, collected: false });
  }

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    asteroidTimer += dt;
    if (asteroidTimer > 800) { // every 0.8s
      spawnAsteroid();
      asteroidTimer = 0;
    }
    // Spawn stars occasionally
    starTimer += dt;
    if (starTimer > 3000) { // every 3s
      spawnStar();
      starTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Rotate asteroid
      a.angle = (a.angle + a.speed) % 360;
      // Collision with ship (simple AABB vs circle approximation)
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const distX = Math.abs(a.x + a.size / 2 - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y + a.size / 2 - (shipRect.y + shipRect.h / 2));
      if (distX <= (shipRect.w / 2 + a.size / 2) && distY <= (shipRect.h / 2 + a.size / 2)) {
        playCollisionSound();
        gameOver = true;
      }
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      if (!s.collected && s.x < shipRect.x + shipRect.w && s.x + s.size > shipRect.x && s.y < shipRect.y + shipRect.h && s.y + s.size > shipRect.y) {
        s.collected = true;
        playStarSound();
        score += 100; // star bonus
      }
      if (s.y > height) stars.splice(i, 1);
    }

    // Score based on time survived
    const now = performance.now();
    score = Math.floor((now - startTime) / 1000) + (score % 100); // preserve star bonus
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Static background stars (twinkling)
    ctx.fillStyle = '#444';
    bgStars.forEach(s => {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    // Ship (gradient triangle with shadow)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#003');
    ctx.fillStyle = shipGrad;
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Asteroids (rotating with radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate((a.angle || 0) * Math.PI / 180);
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Stars (collectible) with glow
    stars.forEach(s => {
      if (!s.collected) {
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
      }
    });

    // Score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
