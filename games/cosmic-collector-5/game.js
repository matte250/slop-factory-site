// Simple game based on IDEA.md – Cosmic Collector
// Canvas with id="game" is assumed in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions (you can adjust as needed)
  canvas.width = 800;
  canvas.height = 600;
  // Create starfield for background
  const starCount = 200;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5,
    // slight horizontal drift for parallax effect
    drift: (Math.random() - 0.5) * 0.2,
  }));
  // Background gradient for deep space
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001020');
  bgGrad.addColorStop(1, '#000010');
  // Audio context and helper for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  let lastThrust = 0;

  // Game state
  const ship = { x: canvas.width / 2, y: canvas.height - 60, size: 20, speed: 4 };
  const gem = { x: Math.random() * canvas.width, y: Math.random() * canvas.height / 2, radius: 8 };
  const asteroids = [];
  // Exhaust particles for ship thrust
  const exhaust = [];
  const asteroidCount = 5;
  const shieldMax = 3;
  let shield = shieldMax;
  let score = 0;
  let keys = {};
  let animationId;

  // Initialize asteroids
  for (let i = 0; i < asteroidCount; i++) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height / 2,
      radius: 15 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
    });
  }

  // Input handling
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    // Move stars to create scrolling effect with slight drift and twinkle
    for (let s of stars) {
      s.y += 0.5; // slow downward drift
      s.x += s.drift; // horizontal drift
      // Wrap vertically
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      // Wrap horizontally
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      // Slight twinkle effect by adjusting alpha
      s.alpha += (Math.random() - 0.5) * 0.05;
      if (s.alpha < 0.3) s.alpha = 0.3;
      if (s.alpha > 1) s.alpha = 1;
    }
    // Generate exhaust particles when ship is moving
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown']) {
      // thrust sound (rate limited)
      const now = audioCtx.currentTime;
      if (now - lastThrust > 0.1) {
        playTone(300, 0.05);
        lastThrust = now;
      }
      exhaust.push({
        x: ship.x,
        y: ship.y + ship.size,
        dx: (Math.random() - 0.5) * 0.5,
        dy: 1 + Math.random() * 0.5,
        life: 30,
        alpha: 0.8,
      });
    }
    // Update exhaust particles
    for (let i = exhaust.length - 1; i >= 0; i--) {
      const p = exhaust[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life--;
      p.alpha *= 0.96;
      if (p.life <= 0 || p.alpha < 0.05) {
        exhaust.splice(i, 1);
      }
    }
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(canvas.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));

    // Move asteroids
    for (let a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // Wrap around edges
      if (a.x < -a.radius) a.x = canvas.width + a.radius;
      if (a.x > canvas.width + a.radius) a.x = -a.radius;
      if (a.y > canvas.height + a.radius) a.y = -a.radius;
    }

    // Collision with gem
    const dxGem = ship.x - gem.x;
    const dyGem = ship.y - gem.y;
    const distGem = Math.hypot(dxGem, dyGem);
    if (distGem < ship.size + gem.radius) {
      score++;
      // Respawn gem
      gem.x = Math.random() * canvas.width;
      gem.y = Math.random() * canvas.height / 2;
    }

    // Collision with asteroids
    for (let a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size + a.radius) {
        shield--;
        // Reposition asteroid to avoid immediate repeated hits
        a.x = Math.random() * canvas.width;
        a.y = -a.radius;
        if (shield <= 0) {
          cancelAnimationFrame(animationId);
          draw(); // final draw showing Game Over
          return;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fill background gradient (deep space)
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield background
    for (let s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship with gradient and glow
    // Apply glow effect
    ctx.shadowColor = 'rgba(0,255,255,0.7)';
    ctx.shadowBlur = 12;
    const shipGrad = ctx.createLinearGradient(ship.x - ship.size, ship.y - ship.size, ship.x + ship.size, ship.y + ship.size);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    // Reset shadow for other drawings
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw exhaust particles (fading trails)
    ctx.fillStyle = 'rgba(0,255,255,0.5)';
    for (let p of exhaust) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1; // reset alpha

    // Draw gem with radial gradient
    const gemGrad = ctx.createRadialGradient(gem.x, gem.y, 0, gem.x, gem.y, gem.radius);
    gemGrad.addColorStop(0, '#0f0');
    gemGrad.addColorStop(1, '#004400');
    ctx.fillStyle = gemGrad;
    ctx.beginPath();
    ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw asteroids with shading
    for (let a of asteroids) {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      radGrad.addColorStop(0, '#888');
      radGrad.addColorStop(1, '#222');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Shield: ${shield}/${shieldMax}`, 10, 40);
    if (shield <= 0) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (shield > 0) {
      animationId = requestAnimationFrame(loop);
    }
  }

  // Start the game
  loop();
})();
