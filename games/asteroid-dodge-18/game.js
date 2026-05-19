// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const ship = { w: 40, h: 20, x: W / 2 - 20, y: H - 30, speed: 5, shield: 0 };
  const asteroids = [];
  const powerUps = [];
  // starfield background
  const backgroundStars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      backgroundStars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        alpha: 0.5 + Math.random() * 0.5
      });
    }
  }
  initStars();
  let keys = {};
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const x = Math.random() * (W - size);
    const speed = 2 + score * 0.02; // gradually increase
    asteroids.push({ x, y: -size, size, speed });
  }

  function spawnPowerUp() {
    const size = 15;
    const x = Math.random() * (W - size);
    powerUps.push({ x, y: -size, size, ttl: 0 });
  }

  // Main loop
  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship
      if (a.y + a.size > ship.y && a.x < ship.x + ship.w && a.x + a.size > ship.x) {
        if (ship.shield > 0) {
          ship.shield--;
          playTone(400); // shield hit
        } else {
          gameOver = true;
          playTone(200); // crash tone
        }
        asteroids.splice(i, 1);
        continue;
      }
      if (a.y > H) asteroids.splice(i, 1);
    }

    // Update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += 2;
      if (p.y + p.size > ship.y && p.x < ship.x + ship.w && p.x + p.size > ship.x) {
        ship.shield = Math.min(3, ship.shield + 1);
        playTone(800); // power‑up collected
        powerUps.splice(i, 1);
        continue;
      }
      if (p.y > H) powerUps.splice(i, 1);
    }

    // spawn logic
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.001) spawnPowerUp();

    score++;
    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);
    // starfield
    ctx.fillStyle = 'white';
    backgroundStars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    // ship (triangle)
    ctx.fillStyle = ship.shield ? 'cyan' : 'white';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (circles with radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.size/2, a.y + a.size/2, a.size*0.2, a.x + a.size/2, a.y + a.size/2, a.size/2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI*2);
      ctx.fill();
    });
    // power‑ups (glowing gold circles)
    powerUps.forEach(p => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'gold';
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(p.x + p.size/2, p.y + p.size/2, p.size/2, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // score
    ctx.fillStyle = 'lime';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    // shield indicator
    if (ship.shield) ctx.fillText('Shield: ' + ship.shield, 10, 40);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  // start loop
  update();
})();
