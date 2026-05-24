// Asteroid Dodge game
// Assumes <canvas id="game"></canvas> exists in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Unlock audio on first user interaction
  const unlockAudio = () => { audioCtx.resume(); window.removeEventListener('keydown', unlockAudio); };
  window.addEventListener('keydown', unlockAudio);
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Ship configuration
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: 'lime'
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidFreq = 90; // frames between spawns
  const maxAsteroids = 30;
  let frame = 0;
  let lives = 3;
  let score = 0;
  let running = true;

  // Starfield data
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 0.5 + 0.2
    });
  }
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const spawnAsteroid = () => {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size / 2,
      speed: Math.random() * 2 + 1,
      color: 'gray'
    });
  };

  const update = () => {
    // ship movement
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // spawn asteroids
    if (frame % asteroidFreq === 0 && asteroids.length < maxAsteroids) spawnAsteroid();

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.r > height) { asteroids.splice(i, 1); score++; playBeep(600, 0.05); }
      // collision (simple AABB vs circle approximation)
      const shipRect = {x: ship.x, y: ship.y, w: ship.w, h: ship.h};
      const distX = Math.abs(a.x + a.r - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y + a.r - (shipRect.y + shipRect.h / 2));
      if (distX <= (shipRect.w / 2 + a.r) && distY <= (shipRect.h / 2 + a.r)) {
        lives--;
        playBeep(400, 0.1); // collision sound
        asteroids.splice(i, 1);
        if (lives <= 0) {
          running = false;
          playBeep(150, 0.5); // game over sound
        }
      }
    }

    // update starfield
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    frame++;
  };

  const draw = () => {
    // Dark background
    ctx.fillStyle = '#001020';
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // Ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.r,
        a.y + a.r,
        a.r * 0.1,
        a.x + a.r,
        a.y + a.r,
        a.r
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  };

  const loop = () => {
    if (running) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with Game Over
    }
  };

  loop();
})();
