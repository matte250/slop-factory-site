// Minimal Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game settings
  const numStars = 100;
  const stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once:true});
  const shipSize = 20;
  const asteroidSize = 30;
  const fuelSize = 15;
  const shipSpeed = 4;
  const spawnInterval = 1000; // ms
  const fuelDecay = 0.05; // per frame

  let ship = { x: width / 2, y: height - shipSize * 2, w: shipSize, h: shipSize };
  let keys = {};
  let asteroids = [];
  let fuels = [];
  let fuel = 1.0; // 0..1
  let score = 0;
  let lastSpawn = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys['arrowleft'] || keys['a']) ship.x -= shipSpeed;
    if (keys['arrowright'] || keys['d']) ship.x += shipSpeed;
    if (keys['arrowup'] || keys['w']) ship.y -= shipSpeed;
    if (keys['arrowdown'] || keys['s']) ship.y += shipSpeed;
    // Clamp
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn asteroids & fuel
    if (performance.now() - lastSpawn > spawnInterval) {
      lastSpawn = performance.now();
      // asteroid from top
      asteroids.push({
        x: Math.random() * (width - asteroidSize),
        y: -asteroidSize,
        r: asteroidSize / 2,
        speed: 2 + Math.random() * 2,
      });
      // occasional fuel cell
      if (Math.random() < 0.3) {
        fuels.push({
          x: Math.random() * (width - fuelSize),
          y: -fuelSize,
          size: fuelSize,
          speed: 1.5,
        });
      }
    }

    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);
    asteroids = asteroids.filter(a => a.y - a.r < height);
    // Update fuels
    fuels.forEach(f => f.y += f.speed);
    fuels = fuels.filter(f => f.y < height);

    // Collision detection
    asteroids.forEach(a => {
      const dx = (a.x + a.r) - (ship.x + ship.w / 2);
      const dy = (a.y + a.r) - (ship.y + ship.h / 2);
      const dist = Math.hypot(dx, dy);
        if (dist < a.r + ship.w / 2) {
          playTone(150, 0.3); // crash sound
          gameOver = true;
        }
    });
    fuels = fuels.filter(f => {
      if (
        f.x < ship.x + ship.w &&
        f.x + f.size > ship.x &&
        f.y < ship.y + ship.h &&
        f.y + f.size > ship.y
      ) {
          playTone(300, 0.2); // fuel collect sound
          fuel = Math.min(1, fuel + 0.2);
          score += 10;
          return false; // remove collected fuel
      }
      return true;
    });

    // Fuel decay
    fuel -= fuelDecay * dt / 16; // normalize to ~60fps
    if (fuel <= 0) gameOver = true;
    score += Math.round(dt / 1000); // time score
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw background stars
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
      s.y += s.speed;
      if (s.y > height) s.y = 0;
    });
    // Draw ship (triangle) with gradient
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#030');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.r, a.y + a.r, a.r * 0.2,
        a.x + a.r, a.y + a.r, a.r
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw fuel cells with glowing effect
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(
        f.x + f.size/2, f.y + f.size/2, f.size * 0.1,
        f.x + f.size/2, f.y + f.size/2, f.size
      );
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#880');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x, f.y, f.size, f.size);
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}` , 10, 20);
    ctx.fillText(`Fuel: ${(fuel*100).toFixed(0)}%` , 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
