// Minimal Void Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // set canvas size to fill its container or default
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // audio context and helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.05); }
  function playExplosion() { playTone(80, 0.3); }

  const ship = {
    x: canvas.width * 0.1,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };

  const keys = { left: false, right: false, up: false };
  window.addEventListener('keydown', (e) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') keys.left = true;
    else if (e.key === 'ArrowRight') keys.right = true;
    else if (e.key === 'ArrowUp') {
      keys.up = true;
      playThrust();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    else if (e.key === 'ArrowRight') keys.right = false;
    else if (e.key === 'ArrowUp') keys.up = false;
  });

  const asteroids = [];

// star field for background
const stars = [];
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }
}
initStars();
  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: canvas.width + size,
      y: Math.random() * canvas.height,
      radius: size,
      speed: Math.random() * 2 + 1,
    });
  }
  let spawnTimer = 0;

  function update(dt) {
    // ship controls
    if (keys.left) ship.angle -= 0.06;
    if (keys.right) ship.angle += 0.06;
    if (keys.up) {
      ship.vx += Math.cos(ship.angle) * 0.1;
      ship.vy += Math.sin(ship.angle) * 0.1;
    }
    // apply velocity & drift
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // keep ship within bounds (wrap vertically)
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;
    // spawn asteroids over time
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = 1000 + Math.random() * 1000; // ms
    }
    // move asteroids leftward
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // remove off‑screen
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
    // update background stars (parallax and twinkle)
    for (const s of stars) {
      s.x -= 0.3; // slow leftward motion for depth
      if (s.x < 0) s.x = canvas.width;
      // twinkle effect
      s.alpha += (Math.random() - 0.5) * 0.02;
      s.alpha = Math.min(1, Math.max(0.3, s.alpha));
    }
    // collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // game over – stop animation loop, explosion sound
        cancelAnimationFrame(animationId);
        playExplosion();
        alert('Game Over!');
        return;
      }
    }
    // lose if ship drifts out of horizontal bounds
    if (ship.x - ship.radius > canvas.width || ship.x + ship.radius < 0) {
      cancelAnimationFrame(animationId);
      alert('Game Over!');
      return;
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#000020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // draw ship (triangle) with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.fillStyle = '#00ffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // thrust flame when accelerating
    if (keys.up) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // draw asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let last = performance.now();
  let animationId;
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    animationId = requestAnimationFrame(loop);
  }
  animationId = requestAnimationFrame(loop);
})();
