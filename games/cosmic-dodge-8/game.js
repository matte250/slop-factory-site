// Cosmic Dodge – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const thrusterSound = () => playSound(200, 0.08);
  const fuelSound = () => playSound(600, 0.15);
  const explosionSound = () => playSound(80, 0.4);

  // Resize canvas to match its displayed size
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const ship = { x: canvas.width / 2, y: canvas.height * 0.85, w: 20, h: 30, speed: 4 };
  const keys = { left: false, right: false };
  const asteroids = [];
  const fuels = [];
  const stars = [];
  const particles = [];
  const shootingStars = [];
  let fuel = 100; // seconds
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Helpers
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Populate starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, canvas.width), y: rand(0, canvas.height), size: rand(0.5, 2), speed: rand(0.2, 0.6) });
  }

  function spawnAsteroid() {
    const size = rand(15, 40);
    asteroids.push({ x: rand(0, canvas.width), y: -size, r: size, speed: rand(1, 3) });
  }

  function spawnFuel() {
    const size = 12;
    fuels.push({ x: rand(0, canvas.width), y: -size, r: size, speed: rand(0.8, 1.5) });
  }

  // Main loop
  function loop(timestamp) {
    const delta = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    if (!gameOver) {
      update(delta);
      draw();
      requestAnimationFrame(loop);
    } else {
      drawGameOver();
    }
  }

  function update(dt) {
    // Fuel consumption
    fuel -= dt;
    if (fuel <= 0) gameOver = true;

    // Ship movement
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(canvas.width - ship.w / 2, ship.x));

    // Update stars
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.x = rand(0, canvas.width);
        s.y = 0;
        s.size = rand(0.5, 2);
        s.speed = rand(0.2, 0.6);
      }
    }

    // Spawn obstacles / fuel
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
      // Collision with ship (approximate as circle vs point)
      const dx = a.x - ship.x;
      const dy = a.y - (canvas.height * 0.85);
      if (Math.hypot(dx, dy) < a.r + ship.w / 2) {
        gameOver = true;
        // Spawn explosion particles
        for (let p = 0; p < 30; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = rand(1, 4);
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: rand(2, 5),
            life: rand(0.5, 1.0)
          });
        }
      }
    }
    // Update particles (explosion)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.016; // assuming ~60fps
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update fuel pods
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.r > canvas.height) fuels.splice(i, 1);
      const dx = f.x - ship.x;
      const dy = f.y - (canvas.height * 0.85);
      if (Math.hypot(dx, dy) < f.r + ship.w / 2) {
        fuel = Math.min(100, fuel + 20);
        fuels.splice(i, 1);
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (twinkling)
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${rand(0.5,1)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship (gradient triangle with thruster)
    // Body gradient
    const shipGrad = ctx.createLinearGradient(0, ship.y - ship.h/2, 0, ship.y + ship.h/2);
    shipGrad.addColorStop(0, '#00ff80');
    shipGrad.addColorStop(1, '#006640');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // Thruster flame when moving
    if (keys.left || keys.right) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h / 2);
      ctx.lineTo(ship.x - 5, ship.y + ship.h / 2 + 12);
      ctx.lineTo(ship.x + 5, ship.y + ship.h / 2 + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Asteroids with radial shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(200,200,200,0.4)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
    // Explosion particles
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,200,50,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fuel pods with glowing gradient
    for (const f of fuels) {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, '#ffee88');
      grad.addColorStop(1, '#ffaa00');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,200,50,0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Fuel timer
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(1)}s`, 10, 20);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(1)}s`, canvas.width / 2, canvas.height / 2 + 30);
  }

  requestAnimationFrame(loop);
})();
