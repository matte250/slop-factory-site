// Simple Space Debris Dodge game with enhanced graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Set canvas size to match its displayed size
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Game parameters
  const GRAVITY = 0.4;
  const THRUST = -8;
  const DEBRIS_SPEED = 4;
  const DEBRIS_INTERVAL = 1500; // ms
  const SHIP_SIZE = 20;
  const MAX_LIVES = 3;

  // Graphics enhancements
  const STAR_COUNT = 100;
  const STAR_SPEED = 0.5;
  const PARTICLE_LIFETIME = 600; // ms
  const PARTICLE_COUNT = 20;

  const stars = Array.from({length: STAR_COUNT}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5
  }));
  const particles = [];

  let ship = { x: 80, y: canvas.height / 2, vy: 0 };
  let debris = [];
  let lastDebrisTime = 0;
  let lives = MAX_LIVES;
  let startTime = performance.now();
  let gameOver = false;

  function resetShip() {
    ship.y = canvas.height / 2;
    ship.vy = 0;
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction
  function resumeAudio() {
    if (audioCtx.state !== 'running') {
      audioCtx.resume();
    }
  }
  canvas.addEventListener('mousedown', resumeAudio);
  canvas.addEventListener('touchstart', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  function thrust() {
    ship.vy = THRUST;
    // Play thrust sound (high-pitched short beep)
    playTone(300, 100);
  }

  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); });

  function addDebris() {
    const size = Math.random() * 30 + 10;
    const y = Math.random() * (canvas.height - size);
    const angle = Math.random() * Math.PI * 2;
    const angularVelocity = (Math.random() - 0.5) * 0.02;
    debris.push({ x: canvas.width + size, y, size, angle, angularVelocity });
  }

  function update(delta) {
    // Ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    // Keep ship within bounds
    if (ship.y > canvas.height - SHIP_SIZE) {
      ship.y = canvas.height - SHIP_SIZE;
      ship.vy = 0;
    }
    if (ship.y < SHIP_SIZE) {
      ship.y = SHIP_SIZE;
      ship.vy = 0;
    }

    // Update stars for parallax effect
    for (let s of stars) {
      s.x -= STAR_SPEED;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }

    // Debris movement and generation
    if (performance.now() - lastDebrisTime > DEBRIS_INTERVAL) {
      addDebris();
      lastDebrisTime = performance.now();
    }
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x -= DEBRIS_SPEED;
      d.angle += d.angularVelocity;
      if (d.x + d.size < 0) {
        debris.splice(i, 1);
      }
    }

    // Update particles (fade out)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
    }

    // Collision detection (simple circle/rect approximation)
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      const dx = d.x - ship.x;
      const dy = d.y + d.size / 2 - ship.y;
      const distance = Math.hypot(dx, dy);
      if (distance < d.size / 2 + SHIP_SIZE / 2) {
        // Collision
        debris.splice(i, 1);
        // Generate explosion particles
        for (let j = 0; j < PARTICLE_COUNT; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: PARTICLE_LIFETIME,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`
          });
        }
        lives--;
        // Play collision sound (low-pitched beep)
        playTone(120, 200);
        if (lives <= 0) {
          gameOver = true;
          // Play game over sound
          playTone(60, 400);
        }
        resetShip();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw particles (explosions)
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life / PARTICLE_LIFETIME, 0);
      ctx.fillRect(p.x, p.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    // Draw ship (simple triangle with gradient)
    const grad = ctx.createLinearGradient(ship.x - SHIP_SIZE, ship.y - SHIP_SIZE / 2, ship.x, ship.y + SHIP_SIZE / 2);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - SHIP_SIZE, ship.y + SHIP_SIZE / 2);
    ctx.lineTo(ship.x - SHIP_SIZE, ship.y - SHIP_SIZE / 2);
    ctx.closePath();
    ctx.fill();

    // Draw debris (rotating rectangles)
    ctx.fillStyle = '#aaa';
    debris.forEach(d => {
      ctx.save();
      ctx.translate(d.x + d.size / 2, d.y + d.size / 2);
      ctx.rotate(d.angle);
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    });

    // HUD: lives and score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + lives, 10, 20);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText('Score: ' + elapsed, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + elapsed, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
