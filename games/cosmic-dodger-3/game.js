// Minimal Cosmic Dodger game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Starfield background
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: 0.5 + Math.random() * 0.5 });
  }

  // Ship (circle approximation)
  // Audio setup
  let audioCtx;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  const playTone = (freq, duration) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };
  const ship = { x: 80, y: height / 2, r: 12, speed: 3 };
  const keys = {};
  window.addEventListener('keydown', e => {
    initAudio();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const r = 8 + Math.random() * 12;
    const y = Math.random() * (height - 2 * r) + r;
    asteroids.push({ x: width + r, y, r, speed: 2 + Math.random() * 2 });
  }

  function update() {
    // ship movement
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // keep inside bounds
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y));

    // move starfield (parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
    }

    // asteroids movement
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) { asteroids.splice(i, 1); score++; playTone(300, 0.1); }
      // collision
      const dx = a.x - ship.x; const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.r) { playTone(100, 0.3); gameOver = true; }
    }
    if (frame++ % asteroidSpawnRate === 0) spawnAsteroid();
  }

  function draw() {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x - ship.r, ship.y - ship.r, ship.x + ship.r, ship.y + ship.r);
    shipGrad.addColorStop(0, '#00ff80');
    shipGrad.addColorStop(1, '#006640');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.r, ship.y);
    ctx.lineTo(ship.x - ship.r, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00331a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px monospace';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
