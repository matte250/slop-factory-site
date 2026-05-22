// Simple Orbital Escape game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  // Starfield will be initialized after canvas is defined
  const starCount = 100;
  const stars = [];
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  }
  function drawStars() {
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Initialize stars after canvas size is known
  initStars();
  // Particle system for thrust and explosion
  const particles = [];
  function spawnParticle(x, y, vx, vy, life, color) {
    particles.push({ x, y, vx, vy, life, maxLife: life, color });
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    for (const p of particles) {
      const alpha = Math.max(p.life / p.maxLife, 0);
      ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function spawnExplosion(x, y) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 600, `rgba(255,165,0,ALPHA)`);
    }
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustGainNode = null;
  const explosionBufferPromise = fetch('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=').then(r=>r.arrayBuffer()).then(buf=>audioCtx.decodeAudioData(buf));
  function playThrust() {
    if (thrustGainNode) return; // already playing
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    thrustGainNode = { oscillator, gain };
  }
  function stopThrust() {
    if (!thrustGainNode) return;
    thrustGainNode.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustGainNode.oscillator.stop(audioCtx.currentTime + 0.1);
    thrustGainNode = null;
  }
  async function playExplosion() {
    const buffer = await explosionBufferPromise;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  }

  // Ship definition
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
    thrusting: false,
    update() {
      // Apply velocity
      this.x += this.vx;
      this.y += this.vy;
      // Screen wrap
      if (this.x < 0) this.x += canvas.width;
      if (this.x > canvas.width) this.x -= canvas.width;
      if (this.y < 0) this.y += canvas.height;
      if (this.y > canvas.height) this.y -= canvas.height;
    },
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      // Ship gradient
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
      grad.addColorStop(0, 'white');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fill();
      // Thrust flame
      if (this.thrusting) {
        ctx.save();
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-14, -5);
        ctx.lineTo(-14, 5);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    },
  };

  // Asteroid definition
  const asteroids = [];
  const asteroidConfig = {
    minSize: 15,
    maxSize: 40,
    minSpeed: 0.5,
    maxSpeed: 2,
    spawnInterval: 2000, // ms
  };

  function spawnAsteroid() {
    const size = Math.random() * (asteroidConfig.maxSize - asteroidConfig.minSize) + asteroidConfig.minSize;
    // Spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -size;
        break;
      case 1: // right
        x = canvas.width + size;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + size;
        break;
      case 3: // left
        x = -size;
        y = Math.random() * canvas.height;
        break;
    }
    const speed = Math.random() * (asteroidConfig.maxSpeed - asteroidConfig.minSpeed) + asteroidConfig.minSpeed;
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x) + (Math.random() - 0.5) * 0.5;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    asteroids.push({ x, y, vx, vy, r: size, angle: 0, rotSpeed: (Math.random() - 0.5) * 0.02 });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

    function handleInput() {
      if (keys['ArrowLeft'] || keys['a']) ship.angle -= ship.rotateSpeed;
      if (keys['ArrowRight'] || keys['d']) ship.angle += ship.rotateSpeed;
      if (keys['ArrowUp'] || keys['w']) {
        ship.vx += Math.cos(ship.angle) * ship.thrust;
        ship.vy += Math.sin(ship.angle) * ship.thrust;
        ship.thrusting = true;
      } else {
        ship.thrusting = false;
      }
      if (keys['ArrowDown'] || keys['s']) {
        ship.vx *= 0.99;
        ship.vy *= 0.99;
      }
      // Audio control for thrust
      if (ship.thrusting) {
        playThrust();
      } else {
        stopThrust();
      }
    }

  // Collision detection
  function checkCollisions() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) return true;
    }
    return false;
  }

  let startTime = performance.now();
  let lastSpawn = performance.now();
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    handleInput();
    ship.update();
    // Thrust particles
    if (ship.thrusting) {
      const angle = ship.angle + Math.PI; // opposite direction
      const speed = 0.5;
      spawnParticle(
        ship.x,
        ship.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        300,
        `rgba(255,255,0,ALPHA)`
      );
    }
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rotSpeed;
      // Wrap around edges
      if (a.x < -a.r) a.x += canvas.width + 2 * a.r;
      if (a.x > canvas.width + a.r) a.x -= canvas.width + 2 * a.r;
      if (a.y < -a.r) a.y += canvas.height + 2 * a.r;
      if (a.y > canvas.height + a.r) a.y -= canvas.height + 2 * a.r;
    }
    updateParticles(dt);
    if (performance.now() - lastSpawn > asteroidConfig.spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    if (checkCollisions()) {
      gameOver = true;
      spawnExplosion(ship.x, ship.y);
      playExplosion();
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    drawStars();
    // Draw ship
    ship.draw();
    // Draw asteroids with shading
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      // asteroid gradient
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.3, 0, 0, a.r);
      grad.addColorStop(0, 'lightgray');
      grad.addColorStop(1, 'gray');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Draw particles (thrust and explosions)
    drawParticles();
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame;
  requestAnimationFrame(loop);
})();
