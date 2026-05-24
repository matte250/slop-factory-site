// Simple Space Drift game – enhanced graphics
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // thrust particles
  const particles = [];

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.05); }
  function playExplosion() { playTone(100, 0.3); }
  function playCollect() { playTone(600, 0.1); }
  function playGameOver() { playTone(50, 0.5); }
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    alive: true,
  };

  let fuel = 100;
  let score = 0;
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  let gameOverPlayed = false;

  // generate asteroids
  const asteroids = [];
  for (let i = 0; i < 8; i++) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: 15 + Math.random() * 20,
    });
  }

  // generate energy orbs
  const orbs = [];
  for (let i = 0; i < 5; i++) {
    orbs.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 8,
    });
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    // background gradient
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#000011');
    grd.addColorStop(1, '#000000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // particles (thrust flame)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // asteroids with shading
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      radGrad.addColorStop(0, '#888');
      radGrad.addColorStop(1, '#444');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // energy orbs with glow
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      orbGrad.addColorStop(0, 'rgba(255,255,0,0.9)');
      orbGrad.addColorStop(1, 'rgba(255,255,0,0.2)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (ship.alive) drawShip();

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}`, 10, 40);
  }

  function update(dt) {
    // handle input
    if (keys.ArrowLeft) ship.angle -= 0.04;
    if (keys.ArrowRight) ship.angle += 0.04;
    if (keys.ArrowUp && fuel > 0) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      fuel -= 0.03 * dt;
      // create thrust particle and sound
      particles.push({
        x: ship.x - Math.cos(ship.angle) * 12,
        y: ship.y - Math.sin(ship.angle) * 12,
        radius: Math.random() * 1.5 + 0.5,
        life: 1,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      });
      playThrust();
    }

    // move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.02;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // move asteroids
    asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < 0) a.x += canvas.width;
      if (a.x > canvas.width) a.x -= canvas.width;
      if (a.y < 0) a.y += canvas.height;
      if (a.y > canvas.height) a.y -= canvas.height;
    });

    // check collisions with asteroids
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        playExplosion();
        ship.alive = false;
        break;
      }
    }

    // check collisions with orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
      if (Math.hypot(dx, dy) < ship.radius + o.radius) {
        fuel = Math.min(100, fuel + 20);
        score += 10;
        playCollect();
        orbs.splice(i, 1);
      }
    }

    // lose condition fuel
    if (fuel <= 0 && ship.alive) {
      playGameOver();
      ship.alive = false;
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 16.666; // normalize to ~60fps units
    last = now;
    if (ship.alive) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
      // play game over sound once
      if (!gameOverPlayed) {
        playGameOver();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
  }

  // input handlers
  window.addEventListener('keydown', e => {
    // resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  // start
  requestAnimationFrame(loop);
})();
