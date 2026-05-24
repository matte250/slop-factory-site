// Solar Flare Dodge – simple canvas game
// Canvas element with id="game" must exist in the HTML.
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Thrust sound (short high‑pitched beep)
  function thrustSound() { playTone(600, 80); }
  // Collision / game over sound (lower pitch longer)
  function collisionSound() { playTone(200, 400); }
  // Simple background hum (periodic low tone)
  setInterval(() => playTone(120, 200), 3000);

  

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set size – you can adjust via CSS, default 800x400
  // Create background stars
  const starCount = 120;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    speed: 0.2 + Math.random() * 0.3,
  }));
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 400;

  // Game settings
  const ship = { x: 80, y: canvas.height / 2, w: 30, h: 20, vy: 0, thrust: 0.4 };
  const flares = [];
  const flareSpawnInterval = 1500; // ms
  const flareSpeed = 2;
  const maxFuel = 30; // seconds
  let fuel = maxFuel;
  let lastSpawn = 0;
  let lastTime = 0;
  let over = false;
  let soundPlayed = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') thrustSound();
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnFlare() {
    const size = 20 + Math.random() * 30;
    const y = Math.random() * (canvas.height - size);
    flares.push({ x: canvas.width, y, w: size, h: size });
  }

  function update(dt) {
    // Fuel consumption
    fuel -= dt / 1000;
    if (fuel <= 0) {
      over = true;
    }

    // Ship control – ArrowUp / ArrowDown
    if (keys['ArrowUp']) ship.vy -= ship.thrust;
    if (keys['ArrowDown']) ship.vy += ship.thrust;
    ship.vy *= 0.97; // simple drag
    ship.y += ship.vy;
    // Clamp ship inside canvas
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Move background stars for parallax effect
    stars.forEach(star => {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = canvas.width;
        star.y = Math.random() * canvas.height;
      }
    });

    // Move flares
    flares.forEach(f => (f.x -= flareSpeed));
    // Remove off‑screen
    while (flares.length && flares[0].x + flares[0].w < 0) flares.shift();

    // Spawn new flares
    if (performance.now() - lastSpawn > flareSpawnInterval) {
      spawnFlare();
      lastSpawn = performance.now();
    }

    // Collision detection
    for (const f of flares) {
      if (
        ship.x < f.x + f.w &&
        ship.x + ship.w > f.x &&
        ship.y < f.y + f.h &&
        ship.y + ship.h > f.y
      ) {
        over = true;
        break;
      }
    }

    // Play collision sound once when game ends
    if (over && !soundPlayed) {
      collisionSound();
      soundPlayed = true;
    }
  }
    
  }

  function draw() {
    // Draw background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001a33');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw stars
  ctx.fillStyle = '#fff';
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // Clear previous drawings (already filled background)
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ship – simple triangle
    // Ship with gradient shading
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#66ff66');
    shipGrad.addColorStop(1, '#009900');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Flares – glowing orange circles with radial gradient
    flares.forEach(f => {
      const grad = ctx.createRadialGradient(
        f.x + f.w / 2,
        f.y + f.h / 2,
        0,
        f.x + f.w / 2,
        f.y + f.h / 2,
        f.w / 2
      );
      grad.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
      grad.addColorStop(1, 'rgba(255, 80, 0, 0.1)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel bar
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(10, 10, (fuel / maxFuel) * 100, 10);
    // Game over text
    if (over) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!over) update(dt);
    draw();
    if (!over) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
