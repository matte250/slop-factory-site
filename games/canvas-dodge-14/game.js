// Simple dodge game – ship avoids falling asteroids
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure the audio context is running after a user gesture
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }
  document.addEventListener('click', resumeAudio, { once: true });
  function playBeep(freq = 440, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playExplosion(freq = 150, duration = 0.3) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: W / 2 - 20,
    y: H - 30,
    speed: 4,
    dx: 0,
  };

  // Asteroid settings
  const asteroids = [];
  let asteroidSpeed = 2;
  let spawnTimer = 0;
  const spawnInterval = 80; // frames
  // Star field
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H });
  }

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  document.addEventListener('keydown', e => { if (e.key in keys) { keys[e.key] = true; playBeep(600, 0.05); } });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function update() {
    // Move ship
    ship.dx = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x + ship.dx));

    // Spawn asteroids
    if (spawnTimer++ >= spawnInterval) {
      spawnTimer = 0;
      const size = 20 + Math.random() * 20;
      asteroids.push({ x: Math.random() * (W - size), y: -size, w: size, h: size, angle: Math.random() * Math.PI * 2 });
    }

    // Move asteroids and rotate
    asteroids.forEach(a => {
      a.y += asteroidSpeed;
      a.angle += 0.01;
    });
    // Remove off‑screen
    while (asteroids.length && asteroids[0].y > H) asteroids.shift();

    // Move background stars
    stars.forEach(s => {
      s.y += 0.3;
      if (s.y > H) s.y = 0;
    });

    // Increase difficulty
    asteroidSpeed += 0.0005;
  }

  function draw() {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars (simple moving points)
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (rotating radial gradient circles)
    asteroids.forEach(a => {
      ctx.save();
      // Translate to asteroid center
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.angle);
      // Gradient centered at origin after translate
      const grad = ctx.createRadialGradient(0, 0, a.w * 0.1, 0, 0, a.w / 2);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function checkCollision() {
    return asteroids.some(a =>
      a.x < ship.x + ship.w && a.x + a.w > ship.x &&
      a.y < ship.y + ship.h && a.y + a.h > ship.y
    );
  }

  function loop() {
    update();
    draw();
    if (checkCollision()) { playExplosion();
      // Game over – display message and stop loop
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  // Start game
  requestAnimationFrame(loop);
})();
