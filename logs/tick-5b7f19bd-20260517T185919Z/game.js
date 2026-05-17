// Asteroid Dodge game
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;
  // Starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // Ship
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Score
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    // Play subtle spawn sound
    playBeep(300, 0.03);
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, w: size, h: size, speed });
  }
    // optional sound on spawn (subtle)
    // playBeep(400, 0.05);
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, w: size, h: size, speed });
  }
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, w: size, h: size, speed });
  }

  function update(dt) {
    // Move stars (parallax)
    for (const s of stars) {
      s.y += 0.3; // slow downward motion
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = 0;
      }
    }
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Collision detection
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
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

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
    // Asteroids (shaded)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.fillRect(a.x, a.y, a.w, a.h);
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const sec = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillText('Score: ' + sec, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastRender || timestamp);
      update(dt);
    }
    draw();
    lastRender = timestamp;
    requestAnimationFrame(loop);
  }
  let lastRender = 0;
  requestAnimationFrame(loop);
})();
