// Simple Nebula Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);
  // Audio context (resume on first interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function ensureAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }
  function playLaser() {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playExplosion() {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  function playGameOver() {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }

  // Ship definition
  const ship = {
    x: 80,
    y: height / 2,
    w: 30,
    h: 20,
    speed: 4,
    fuel: 1000,
    alive: true,
  };

  const keys = {};
  const asteroids = [];
  const lasers = [];
  const nebula = [];
  let frames = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size,
      speed: 2 + Math.random() * 3,
    });
  }

  function fireLaser() {
    lasers.push({
      x: ship.x + ship.w,
      y: ship.y + ship.h / 2,
      speed: 8,
    });
    playLaser();
  }

  function update() {
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    // Keep within canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    // Fuel consumption
    ship.fuel--;
    if (ship.fuel <= 0) { gameOver = true; playGameOver(); }
    // Fire laser
    if (keys['Space'] && frames % 15 === 0) fireLaser();
    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.speed;
      if (l.x > width) lasers.splice(i, 1);
    }
    // Spawn asteroids
    if (frames % 60 === 0) spawnAsteroid();
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    // Nebula particles (slow drifting dust)
    if (frames % 5 === 0) {
      nebula.push({
        x: Math.random() * width,
        y: height,
        dx: -0.2 + Math.random() * 0.4,
        dy: -0.5 - Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        alpha: 0.2 + Math.random() * 0.3,
      });
    }
    for (let i = nebula.length - 1; i >= 0; i--) {
      const p = nebula[i];
      p.x += p.dx;
      p.y += p.dy;
      p.alpha -= 0.005;
      if (p.alpha <= 0) nebula.splice(i, 1);
    }
    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // ship-asteroid
      if (
        ship.x < a.x + a.r &&
        ship.x + ship.w > a.x - a.r &&
        ship.y < a.y + a.r &&
        ship.y + ship.h > a.y - a.r
      ) {
        gameOver = true;
        playGameOver();
      }
      // laser-asteroid
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (l.x > a.x - a.r && l.x < a.x + a.r && l.y > a.y - a.r && l.y < a.y + a.r) {
          // spawn explosion particles
          for (let k = 0; k < 8; k++) {
            nebula.push({
              x: a.x,
              y: a.y,
              dx: -1 + Math.random() * 2,
              dy: -1 + Math.random() * 2,
              size: 1 + Math.random() * 2,
              alpha: 0.6,
            });
          }
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }
    }
    frames++;
  }

  function draw() {
    // Background with vertical gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001030');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars (varying size and opacity)
    for (let i = 0; i < 80; i++) {
      const starSize = Math.random() * 2;
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(Math.random() * width, Math.random() * height, starSize, starSize);
    }
    // Nebula particles (soft glowing dust)
    nebula.forEach(p => {
      ctx.fillStyle = `rgba(100, 150, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Asteroids with radial gradient shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaaaaa');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Lasers (glowing red)
    lasers.forEach(l => {
      ctx.strokeStyle = 'rgba(255,0,0,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 2);
      ctx.lineTo(l.x + 8, l.y - 2);
      ctx.stroke();
    });
    // Fuel bar
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(10, 10, ship.fuel / 2, 10);
    // Game over message
    if (gameOver) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
