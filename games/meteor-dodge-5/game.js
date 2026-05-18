// Meteor Dodge Game
// Canvas with id="game" defined in HTML.
// Ship on left, meteors spawn right moving left.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Background low hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60;
  bgOsc.type = 'sine';
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgGain.gain.value = 0.02;
  bgOsc.start();
  // Ensure audio context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  document.addEventListener('click', resumeAudio, { once: true });
  // Play collision sound
  function playCollisionSound() {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = 200;
    o.type = 'square';
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    o.stop(audioCtx.currentTime + 0.2);
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship properties
  const ship = {
    x: 30,
    y: height / 2,
    w: 20,
    h: 40,
    speed: 4,
  };

  // Input handling (arrow keys and mouse)
  const keys = { ArrowUp: false, ArrowDown: false };
  document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
  });

  // Meteor pool
  const meteors = [];
  const stars = [];
  const particles = [];
  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
    });
  }
  let meteorSpawnTimer = 0;
  let meteorInterval = 1500; // ms
  let lastTime = performance.now();
  let speedFactor = 1;
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    const size = 20 + Math.random() * 30;
    meteors.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
    });
  }

  function update(dt) {
    // Update starfield (move left slowly)
    for (const s of stars) {
      s.x -= 0.2;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }

    if (!gameOver) {
      // Update ship position (keyboard)
      if (keys.ArrowUp) ship.y -= ship.speed;
      if (keys.ArrowDown) ship.y += ship.speed;
      // Clamp ship inside canvas
      ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    }

    // Spawn meteors over time
    meteorSpawnTimer += dt;
    if (meteorSpawnTimer > meteorInterval) {
      spawnMeteor();
      meteorSpawnTimer = 0;
      // gradually increase difficulty
      if (meteorInterval > 400) meteorInterval -= 20;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x -= (m.speed * speedFactor);
      // Remove off‑screen meteors
      if (m.x + m.w < 0) meteors.splice(i, 1);
    }

    // Collision detection (only if not already game over)
    if (!gameOver) {
      for (const m of meteors) {
        if (
          ship.x < m.x + m.w &&
          ship.x + ship.w > m.x &&
          ship.y < m.y + m.h &&
          ship.y + ship.h > m.y
        ) {
          playCollisionSound();
          gameOver = true;
          // create explosion particles at ship center
          createExplosion(ship.x + ship.w / 2, ship.y + ship.h / 2);
          break;
        }
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 0.05;
      p.y += p.vy * dt * 0.05;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Score is time survived in seconds
    if (!gameOver) {
      score = Math.floor((performance.now() - lastTime) / 1000);
    }
  }

  // Create explosion particles
  function createExplosion(x, y) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        life: 600,
        maxLife: 600,
      });
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // Draw ship as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, '#a44');
      grad.addColorStop(1, '#600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw particles
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,165,0,${p.life / p.maxLife})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
