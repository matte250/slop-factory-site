// Cosmic Collector – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ==== State ====
  const ship = { x: W / 2, y: H / 2, angle: 0, speed: 2 };
  let health = 3;
  let score = 0;
  const orbs = [];
  const asteroids = [];
  const stars = [];

  // ==== Helpers ====
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ==== Sound helpers ====
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(800, 0.08);
  const playHit = () => playTone(200, 0.2);
  const playThrust = () => playTone(400, 0.05);
  const playGameOver = () => playTone(100, 0.5);

  // Populate static starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, W), y: rand(0, H), r: rand(0.5, 1.5) });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Spawn functions
  const spawnOrb = () => {
    orbs.push({ x: rand(0, W), y: rand(0, H), r: 8 });
  };
  const spawnAsteroid = () => {
    const a = { x: rand(0, W), y: rand(0, H), r: rand(15, 30) };
    // give a small random velocity
    a.vx = rand(-0.5, 0.5);
    a.vy = rand(-0.5, 0.5);
    asteroids.push(a);
  };

  // Timers
  let orbTimer = 0;
  let astTimer = 0;

  // ==== Game Loop ====
  function update(dt) {
    // Controls – arrow keys or WASD
    if (keys.ArrowLeft || keys.a) ship.angle -= 0.06;
    if (keys.ArrowRight || keys.d) ship.angle += 0.06;
    const thrusting = keys.ArrowUp || keys.w;
    if (thrusting) {
      ship.x += Math.cos(ship.angle) * ship.speed;
      ship.y += Math.sin(ship.angle) * ship.speed;
      playThrust();
    }
    if (keys.ArrowDown || keys.s) {
      ship.x -= Math.cos(ship.angle) * ship.speed * 0.5;
      ship.y -= Math.sin(ship.angle) * ship.speed * 0.5;
    }
    // Wrap around
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;

    // Move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < 0) a.x += W;
      if (a.x > W) a.x -= W;
      if (a.y < 0) a.y += H;
      if (a.y > H) a.y -= H;
    }

    // Collision detection
    for (let i = orbs.length - 1; i >= 0; i--) {
      if (dist(ship, orbs[i]) < orbs[i].r + 10) {
        score++;
        playCollect();
        orbs.splice(i, 1);
      }
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (dist(ship, asteroids[i]) < asteroids[i].r + 10) {
        health--;
        playHit();
        asteroids.splice(i, 1);
        if (health <= 0) {
          playGameOver();
          return false; // stop game
        }
      }
    }

    // Spawn rules
    orbTimer += dt;
    astTimer += dt;
    if (orbTimer > 1500) { spawnOrb(); orbTimer = 0; }
    if (astTimer > 2500) { spawnAsteroid(); astTimer = 0; }
    return true;
  }

  function draw() {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars – twinkling tiny circles
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${rand(0.2,0.8)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // orbs – glowing gradient
    for (const o of orbs) {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, 'rgba(255,215,0,0.9)');
      grad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
    }
    // asteroids – rough gray circles with slight shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship – triangle with outline and optional thrust
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // body
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // thrust flame when accelerating forward
    if (keys.ArrowUp || keys.w) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${health}`, 10, 40);
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    const alive = update(dt);
    draw();
    if (alive) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, W / 2 - 80, H / 2 + 40);
    }
  }
  requestAnimationFrame(loop);
})();
