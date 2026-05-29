// Simple side‑scrolling game based on IDEA.md
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
const canvas = document.getElementById('game');
    if (!canvas) return; // no canvas, nothing to do
    const ctx = canvas.getContext('2d');
    // Set canvas dimensions (you can adjust as needed)
    canvas.width = canvas.clientWidth || 800;
    canvas.height = canvas.clientHeight || 400;

    // Audio context for sounds
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playBeep(freq, dur) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    }

    // Star field for background
    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
    }));


  const ship = { x: 50, y: canvas.height / 2, w: 30, h: 20, dy: 0 };
  let asteroids = [];
  let explosions = [];
  let lastSpawn = 0;
  let gameOver = false;
  let speedFactor = 1;

  // Create explosion particles at (x,y)
  function createExplosion(x, y) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      explosions.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 2 + 1,
        life: 30,
        maxLife: 30,
      });
    }
  }

  // Input handling (arrow up/down)
  const keys = {};
  window.addEventListener('keydown', async e => { keys[e.key] = true; if (audioCtx.state === 'suspended') await audioCtx.resume(); playBeep(400,0.05); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    // Random asteroid color hue
    const hue = Math.random() * 360;
    asteroids.push({
      x: canvas.width + size,
      y: Math.random() * (canvas.height - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
      hue,
    });
  }

  function update(dt) {
    // Ship movement
    if (keys['ArrowUp']) ship.dy = -4; else if (keys['ArrowDown']) ship.dy = 4; else ship.dy = 0;
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y + ship.dy));

    // Move stars to create parallax effect
    stars.forEach(star => {
      star.x -= speedFactor * 0.5;
      if (star.x < 0) {
        star.x = canvas.width;
        star.y = Math.random() * canvas.height;
        star.r = Math.random() * 2 + 0.5;
      }
    });

    // Spawn asteroids
    if (performance.now() - lastSpawn > 1500 / speedFactor) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    asteroids.forEach(a => a.x -= a.speed * speedFactor);
    asteroids = asteroids.filter(a => a.x + a.w > 0);

    // Update explosions
    explosions.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    explosions = explosions.filter(p => p.life > 0);

    // Collision detection (AABB)
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w && ship.x + ship.w > a.x &&
        ship.y < a.y + a.h && ship.y + ship.h > a.y
      ) {
        gameOver = true;
        createExplosion(ship.x + ship.w / 2, ship.y + ship.h / 2);
        // Play explosion sound (lower pitch)
        playBeep(200, 0.3);
        break;
      }
    }
    // Gradually increase speed
    speedFactor += dt * 0.00001;
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001020');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = 'white';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (triangle with outline)
    ctx.fillStyle = 'cyan';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Asteroids as circles with radial gradient
    asteroids.forEach(a => {
      // Create a radial gradient based on asteroid hue
      const radGrad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      const hue = a.hue || 0;
      radGrad.addColorStop(0, `hsl(${hue}, 70%, 80%)`);
      radGrad.addColorStop(1, `hsl(${hue}, 70%, 30%)`);
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Explosion particles (if any)
    if (explosions && explosions.length) {
      explosions.forEach(p => {
        ctx.fillStyle = `rgba(255,165,0,${p.life / p.maxLife})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
