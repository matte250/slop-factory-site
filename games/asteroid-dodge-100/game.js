// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Simple sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  function playTone(freq, duration = 100) {
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

  function playExplosion() {
    // Low rumble
    playTone(80, 300);
    setTimeout(() => playTone(120, 200), 100);
  }

  function playFuel() {
    // Short higher beep
    playTone(600, 150);
  }

  // Ship definition (drawn as a triangle)
  const ship = {
    w: 30,
    h: 20,
    x: W / 2,
    y: H - 40,
    speed: 4,
    angle: 0,
    energy: 100,
    fuel: 0,
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const asteroids = [];
  const fuels = [];
  const stars = [];
  const particles = [];
  let asteroidTimer = 0;
  let fuelTimer = 0;
  let starTimer = 0;
  let score = 0;
  let distance = 0;
  let difficulty = 1;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (W - size),
      y: -size,
      r: size / 2,
      v: 1 + difficulty * 0.5,
    });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      v: 1 + difficulty * 0.3,
    });
  }

  // Spawn background stars
  function spawnStar() {
    const size = Math.random() * 2 + 1; // 1-3px
    const speed = 0.5 + Math.random() * 0.5; // slower than asteroids
    const hue = Math.floor(Math.random() * 60) + 190; // bluish-white
    stars.push({
      x: Math.random() * W,
      y: -size,
      size,
      v: speed,
      color: `hsl(${hue}, 20%, 80%)`,
    });
  }

  function rectCircleCollide(rect, circ) {
    const distX = Math.abs(circ.x + circ.r - (rect.x + rect.w / 2));
    const distY = Math.abs(circ.y + circ.r - (rect.y + rect.h / 2));
    if (distX > rect.w / 2 + circ.r) return false;
    if (distY > rect.h / 2 + circ.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circ.r * circ.r;
  }

  function rectRectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // Ship movement with simple tilt
    if (keys.ArrowLeft || keys.a) {
      ship.x -= ship.speed;
      ship.angle = -Math.PI / 6; // tilt left
    } else if (keys.ArrowRight || keys.d) {
      ship.x += ship.speed;
      ship.angle = Math.PI / 6; // tilt right
    } else {
      ship.angle = 0; // level when not turning
    }
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // Energy drain
    ship.energy -= 0.02 * dt * difficulty;
    if (ship.energy <= 0) {
      endGame();
      return;
    }

    // Spawn timers
    asteroidTimer += dt;
    fuelTimer += dt;
    starTimer += dt;
    if (asteroidTimer > 1000 / (5 * difficulty)) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
    if (fuelTimer > 5000) {
      spawnFuel();
      fuelTimer = 0;
    }
    if (starTimer > 100) { // many small stars
      spawnStar();
      starTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.v * dt * 0.1;
      if (a.y - a.r > H) asteroids.splice(i, 1);
      else if (rectCircleCollide(ship, a)) {
        endGame();
        return;
      }
    }

    // Update fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.v * dt * 0.1;
      if (f.y > H) fuels.splice(i, 1);
      else if (rectRectCollide(ship, f)) {
        ship.energy = Math.min(100, ship.energy + 30);
        ship.fuel++;
        fuels.splice(i, 1);
        playFuel();
      }
    }

    // Update stars (simple parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.v * dt * 0.05; // slower movement
      if (s.y > H) stars.splice(i, 1);
    }

    // Score & difficulty
    distance += dt * 0.01 * difficulty;
    score = Math.floor(distance) + ship.fuel * 10;
    if (distance % 5000 < dt) difficulty += 0.1; // gradual ramp
  }

  let running = true;
  function endGame() {
    running = false;
    playExplosion();
    alert('Game Over! Score: ' + score);
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const s of stars) {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Ship (drawShip handles its own style)
    drawShip();

    // Asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.r,
        a.y + a.r,
        a.r * 0.2,
        a.x + a.r,
        a.y + a.r,
        a.r
      );
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fuel cells - glowing
    for (const f of fuels) {
      ctx.fillStyle = '#ff0';
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.shadowBlur = 0;
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Energy: ' + Math.floor(ship.energy), 10, 20);
    ctx.fillText('Score: ' + score, 10, 40);
  }

  // Draw ship as rotated triangle
  function drawShip() {
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
