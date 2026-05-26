// Simple Asteroid Dodge game targeting <canvas id="game">.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = 800);
  const height = (canvas.height = 600);

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.05); }
  function playExplosion() { playTone(80, 0.5); }

  // Player ship
  const ship = { x: 80, y: height / 2, w: 30, h: 20, speed: 4 };
  const keys = {};
  document.addEventListener('keydown', e => {
    // Ensure audio context is running on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) playThrust();
  });
  document.addEventListener('keyup', e => (keys[e.key] = false));

  // Stars background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 90; // frames
  let speedFactor = 1;
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 40 + 20;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      vx: -(2 + Math.random() * 2) * speedFactor,
    });
  }

  function update() {
    if (gameOver) return;
    // move ship
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // keep within bounds
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // spawn asteroids
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      // remove off‑screen
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }

    // collision detection
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y < a.y + a.h &&
        ship.y + ship.h > a.y
      ) {
        playExplosion();
        gameOver = true;
        break;
      }
    }

    // increase difficulty
    if (frame % 600 === 0 && frame > 0) {
      speedFactor += 0.2;
      spawnInterval = Math.max(30, spawnInterval - 5);
    }
    frame++;
    score = Math.floor(frame / 60);
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars background (move left for parallax)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      s.x -= 0.5; // slow movement
      if (s.x < 0) s.x = width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship (draw as triangle with optional thrust flame)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving
    if (keys.ArrowUp || keys.w || keys.ArrowDown || keys.s || keys.ArrowLeft || keys.a || keys.ArrowRight || keys.d) {
      ctx.fillStyle = '#ff8';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h / 2);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 - 5);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 + 5);
      ctx.closePath();
      ctx.fill();
    }

    // asteroids (draw as circles with simple shading)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.2,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
