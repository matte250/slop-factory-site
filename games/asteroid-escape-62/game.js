// Simple Asteroid Escape game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Ensure audio context starts on user interaction
  const resumeAudio = () => audioCtx.state === 'suspended' && audioCtx.resume();
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  const ship = { x: 50, y: height / 2 - 15, w: 30, h: 30, speed: 4 };
  const keys = {};
  const asteroids = [];
  // starfield particles
  const stars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
  }
  initStars();
  let lastSpawn = 0, score = 0, startTime = performance.now(), gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const y = Math.random() * (height - size);
    const speed = 2 + Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // rotate per frame
    asteroids.push({ x: width, y, w: size, h: size, speed, angle, rotSpeed });
  }

  function rectsCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
  // Move stars for parallax effect
  stars.forEach(star => {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = width;
      star.y = Math.random() * height;
    }
  });
    // Ship movement
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // Keep in bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn asteroids
    if (performance.now() - lastSpawn > 800 + Math.random() * 700) {
      spawnAsteroid();
      playTone(250, 0.05); // asteroid spawn sound
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      a.angle += a.rotSpeed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      else if (rectsCollide(ship, a)) { playTone(150, 0.3); gameOver = true; }
    }

    // Score as seconds survived
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background (gradient)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.lineTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (circles with shading)
    asteroids.forEach(a => {
      ctx.save();
      const cx = a.x + a.w / 2;
      const cy = a.y + a.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(a.angle);
      const gradA = ctx.createRadialGradient(0, 0, a.w * 0.2, 0, 0, a.w / 2);
      gradA.addColorStop(0, '#bbb');
      gradA.addColorStop(1, '#555');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 30);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame
    }
  }

  requestAnimationFrame(loop);
})();
