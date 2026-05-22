// Simple top‑down canvas game (Canvas Escape)
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context is resumed on first interaction
  window.addEventListener('click', () => audioCtx.resume(), {once:true});

  // ----- Game state -----
  const ship = { x: width/2, y: height/2, angle: 0, vx: 0, vy: 0, radius: 12 };
  const obstacles = [];
  const stars = [];
  let score = 0;
  let timeLeft = 60; // seconds
  let lastTime = performance.now();
  let gameOver = false;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function distance(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }
  // Simple particle for ship thrust trail
  const particles = [];
  function addParticle(x, y, angle) {
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * -0.5 + rand(-0.2,0.2),
      vy: Math.sin(angle) * -0.5 + rand(-0.2,0.2),
      life: 30,
      maxLife: 30,
    });
  }

  function spawnObstacle() {
    const side = Math.floor(rand(0, 4)); // 0: top,1:right,2:bottom,3:left
    let x, y, vx, vy;
    const speed = rand(0.5, 2);
    if (side === 0) { x = rand(0, width); y = -20; vx = rand(-1,1); vy = speed; }
    else if (side === 1) { x = width + 20; y = rand(0, height); vx = -speed; vy = rand(-1,1); }
    else if (side === 2) { x = rand(0, width); y = height + 20; vx = rand(-1,1); vy = -speed; }
    else { x = -20; y = rand(0, height); vx = speed; vy = rand(-1,1); }
    obstacles.push({ x, y, vx, vy, radius: rand(15,30) });
  }

  function spawnStar() {
    stars.push({ x: rand(0, width), y: rand(0, height), radius: 5, collected: false });
  }

  // ----- Main loop -----
  function update(dt) {
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (gameOver) return;

    // timer
    timeLeft -= dt/1000;
    if (timeLeft <= 0) { timeLeft = 0; gameOver = true; }

    // ship controls
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= 3 * dt/1000;
    if (keys['ArrowRight'] || keys['d']) ship.angle += 3 * dt/1000;
    if (keys['ArrowUp'] || keys['w']) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      // add thrust particle
      addParticle(ship.x, ship.y, ship.angle);
      // thrust sound
      playTone(600, 0.05);
    }
    // apply friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx; ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // obstacles movement & cleanup
    for (let i = obstacles.length-1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx; o.y += o.vy;
      // wrap
      if (o.x < -50) o.x = width+50; else if (o.x > width+50) o.x = -50;
      if (o.y < -50) o.y = height+50; else if (o.y > height+50) o.y = -50;
      // collision with ship
      if (distance(ship, o) < ship.radius + o.radius) {
        playTone(200, 0.2); // collision
        gameOver = true;
      }
    }

    // stars collection
    for (const s of stars) {
      if (!s.collected && distance(ship, s) < ship.radius + s.radius) {
        s.collected = true; score += 10; playTone(800, 0.1); }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // particles (thrust trail)
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(0,255,0,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15,0);
    ctx.lineTo(-10,-10);
    ctx.lineTo(-10,10);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.strokeStyle = '#080';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // obstacles with radial gradient
    for (const o of obstacles) {
      const grad = ctx.createRadialGradient(o.x, o.y, o.radius * 0.2, o.x, o.y, o.radius);
      grad.addColorStop(0, 'rgba(255,0,0,0.8)');
      grad.addColorStop(1, 'rgba(150,0,0,0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI*2);
      ctx.fill();
    }

    // stars (twinkling)
    ctx.fillStyle = '#ff0';
    for (const s of stars) {
      if (s.collected) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${timeLeft.toFixed(1)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // initial spawns
  setInterval(spawnObstacle, 1500);
  setInterval(spawnStar, 4000);
  requestAnimationFrame(loop);
})();
