// Enhanced "Cosmic Dodge" game implementation with better graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas to match its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Create a static starfield background
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5,
  }));
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  const ship = {
    width: 30,
    height: 40,
    x: canvas.width / 2,
    y: canvas.height - 60,
    speed: 5,
    color: '#0ff',
  };

  let asteroids = [];
  let particles = [];
  let keys = {};
  let lastSpawn = 0;
  let spawnInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let state = 'menu'; // menu | playing | gameover

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') {
      if (state !== 'playing') startGame();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function startGame() {
    // Play start tone
    playBeep(440, 150);
    asteroids = [];
    particles = [];
    ship.x = canvas.width / 2;
    score = 0;
    lastSpawn = 0;
    spawnInterval = 1000;
    lastTime = performance.now();
    state = 'playing';
    requestAnimationFrame(loop);
  }

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = radius + Math.random() * (canvas.width - 2 * radius);
    const speed = 2 + Math.random() * 3 + score / 30; // increase with score
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(ship.width / 2, Math.min(canvas.width - ship.width / 2, ship.x));

    // Update starfield (slow drift for parallax effect)
    stars.forEach(s => {
      s.y += 0.2; // subtle downward motion
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // gradually increase difficulty
      if (spawnInterval > 300) spawnInterval -= 20;
    }

    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);
    asteroids = asteroids.filter(a => a.y - a.r < canvas.height);

    // Collision detection (simple rectangle-circle approximation)
    const shipCenter = { x: ship.x, y: ship.y };
    for (const a of asteroids) {
      const dx = shipCenter.x - a.x;
      const dy = shipCenter.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.width, ship.height) / 2) {
        explode();
        state = 'gameover';
        break;
      }
    }

    // Update particles (simple fading circles)
    particles.forEach(p => {
      p.life -= dt;
      p.y += p.vy;
      p.x += p.vx;
    });
    particles = particles.filter(p => p.life > 0);

    // Update score based on survival time
    score = Math.floor((performance.now() - lastTime) / 1000);
  }

  function explode() {
    // Play explosion sound
    playBeep(150, 300);
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800,
        color: 'orange',
      });
    }
  }

  function draw() {
    // Fill background with deep space color
    ctx.fillStyle = '#001020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield (twinkling effect via alpha)
    stars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship with glowing gradient
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.height / 2, ship.x, ship.y + ship.height / 2);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.height / 2);
    ctx.lineTo(ship.x - ship.width / 2, ship.y + ship.height / 2);
    ctx.lineTo(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.closePath();
    ctx.fill();
    // subtle ship outline
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      radGrad.addColorStop(0, '#aaa');
      radGrad.addColorStop(1, '#444');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw particles (explosion sparks)
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 800;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    if (state === 'menu') {
      ctx.textAlign = 'center';
      ctx.fillText('Cosmic Dodge', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2 + 20);
    }
    if (state === 'gameover') {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 0);
      ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(ts) {
    const dt = ts - (lastTime || ts);
    if (state === 'playing') {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // draw menu / gameover
    }
    lastTime = ts;
  }

  // Initial draw for menu
  draw();
})();
