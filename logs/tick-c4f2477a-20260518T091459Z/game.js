// Minimal Astro Dodge game targeting <canvas id="game"></canvas>
// Ship (blue triangle) moves with arrow keys, asteroids (gray circles) come from right,
// power‑ups (green squares) grant a temporary shield. Lose on collision or timer.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game state
  const ship = { x: 80, y: height / 2, size: 20, speed: 4 };
  let asteroids = [];
  let powerUps = [];
  let shield = false;
  let shieldTimer = 0;
  let score = 0;
  let timeLeft = 30; // seconds
  let gameOver = false;
  // Visual enhancements
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2 + 0.5,
    twinkle: Math.random()
  }));
  let particles = [];

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Spawn functions
  function spawnAsteroid() {
    const radius = 10 + Math.random() * 10;
    asteroids.push({ x: width + radius, y: Math.random() * height, r: radius, speed: 2 + Math.random() * 2 + score / 1000 });
  }
  function spawnPowerUp() {
    const size = 12;
    powerUps.push({ x: width + size, y: Math.random() * height, size, speed: 2 });
    // Play power‑up spawn sound
    playTone(800, 0.07);
  }

  // Timers
  const asteroidInterval = setInterval(spawnAsteroid, 1000);
  const powerUpInterval = setInterval(spawnPowerUp, 10000);
  const countdown = setInterval(() => {
    if (!gameOver) {
      timeLeft--;
      if (timeLeft <= 0) gameOver = true;
    }
  }, 1000);

  function update() {
    if (gameOver) return;
    // Ensure audio context is running after first interaction
    if (audioCtx.state !== 'running') {
      window.addEventListener('click', () => audioCtx.resume(), { once: true });
      window.addEventListener('keydown', () => audioCtx.resume(), { once: true });
    }
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // Move asteroids
    asteroids.forEach(a => a.x -= a.speed);
    asteroids = asteroids.filter(a => a.x + a.r > 0);

    // Move power‑ups
    powerUps.forEach(p => p.x -= p.speed);
    powerUps = powerUps.filter(p => p.x + p.size > 0);

    // Update stars twinkle
    stars.forEach(s => {
      s.twinkle += (Math.random() - 0.5) * 0.02;
      s.r = Math.max(0.5, Math.min(2.5, s.r + s.twinkle));
    });

    // Update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    particles = particles.filter(p => p.life > 0);

    // Collisions
    asteroids.forEach((a, i) => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size / 2) {
        if (shield) {
          // destroy asteroid on shield hit with particle burst and sound
          particles.push(...Array.from({length:10},()=>({
            x:a.x,
            y:a.y,
            vx:(Math.random()-0.5)*2,
            vy:(Math.random()-0.5)*2,
            life:30,
            size:a.r/2
          })));
          playTone(500, 0.08);
          asteroids.splice(i, 1);
          shield = false;
        } else {
          // collision without shield ends game with sound
          playTone(200, 0.2);
          gameOver = true;
        }
      }
    });
    powerUps.forEach((p, i) => {
      if (Math.abs(p.x - ship.x) < p.size && Math.abs(p.y - ship.y) < p.size) {
        shield = true;
        shieldTimer = 180; // frames (~3 seconds at 60fps)
        powerUps.splice(i, 1);
        // Shield activation sound
        playTone(600, 0.1);
      }
    });
    if (shield) shieldTimer--;
    if (shieldTimer <= 0) shield = false;

    // Score
    score++;
  }

function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Particles (explosions)
    particles.forEach(p => {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,255,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship with gradient outline when shielded
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.fillStyle = shield ? '#00f8' : '#00f';
    ctx.beginPath();
    ctx.moveTo(0, -ship.size / 2);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(ship.size / 2, ship.size / 2);
    ctx.closePath();
    ctx.fill();
    if (shield) {
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Asteroids with subtle shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Power‑ups with glow
    powerUps.forEach(p => {
      ctx.save();
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#0c0';
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score / 60)}`, 10, 20);
    ctx.fillText(`Time: ${timeLeft}s`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Final Score: ${Math.floor(score / 60)}`, width / 2, height / 2 + 20);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
