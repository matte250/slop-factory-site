// Simple Orbital Dodge game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  const CENTER = { x: W / 2, y: H / 2 };
  // starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    a: Math.random() * 0.8 + 0.2
  }));
  const PLANET_RADIUS = 40;

  // ----- Ship -----
  const ship = {
    angle: 0, // radians around planet
    radius: PLANET_RADIUS + 20, // distance from planet centre
    speed: 0, // radial speed
    fuel: 100,
    size: 8,
    update(dt) {
      // rotate with arrows
      if (keys.left) this.angle -= 2 * dt;
      if (keys.right) this.angle += 2 * dt;
      // thrust outward
if (keys.up && this.fuel > 0) {
          this.speed += 100 * dt; // boost outward
          this.fuel -= 30 * dt;
          // thrust sound
          playTone(600, 0.08);
        }
      // gravity pull back to orbit
      const target = PLANET_RADIUS + 20;
      const diff = target - this.radius;
      this.speed += diff * 2 * dt; // simple spring
      // apply speed
      this.radius += this.speed * dt;
      // damping
      this.speed *= 0.98;
    },
    draw() {
      const x = CENTER.x + Math.cos(this.angle) * this.radius;
      const y = CENTER.y + Math.sin(this.angle) * this.radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.angle + Math.PI / 2);
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size / 2, this.size);
      ctx.lineTo(-this.size / 2, this.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  // ----- Asteroids -----
  const asteroids = [];
  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 50 + Math.random() * 100;
    if (side === 0) { x = 0; y = Math.random() * H; vx = speed; vy = (Math.random() - 0.5) * speed; }
    else if (side === 1) { x = W; y = Math.random() * H; vx = -speed; vy = (Math.random() - 0.5) * speed; }
    else if (side === 2) { x = Math.random() * W; y = 0; vx = (Math.random() - 0.5) * speed; vy = speed; }
    else { x = Math.random() * W; y = H; vx = (Math.random() - 0.5) * speed; vy = -speed; }
    asteroids.push({ x, y, vx, vy, r: 12 + Math.random() * 8 });
  }

  // ----- Input -----
  const keys = { left: false, right: false, up: false };
  window.addEventListener('keydown', e => {
    // resume AudioContext on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') keys.up = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
  });

  // ----- Game loop -----
  let last = performance.now();
  let elapsed = 0;
  let score = 0;
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    ship.update(dt);
    // move asteroids
    asteroids.forEach(a => { a.x += a.vx * dt; a.y += a.vy * dt; });
    // spawn
    if (Math.random() < dt * 0.5) spawnAsteroid();
    // collision detection
    const sx = CENTER.x + Math.cos(ship.angle) * ship.radius;
    const sy = CENTER.y + Math.sin(ship.angle) * ship.radius;
    for (const a of asteroids) {
      const dx = a.x - sx; const dy = a.y - sy;
      if (Math.hypot(dx, dy) < a.r + ship.size) { playTone(200, 0.3); gameOver = true; break; }
    }
    // out of fuel ends game
    if (ship.fuel <= 0) gameOver = true;
    // score based on time survived
    score += dt;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // starfield (twinkling)
    for (const s of stars) {
      // slight twinkle change
      s.a += (Math.random() - 0.5) * 0.02;
      if (s.a < 0.2) s.a = 0.2;
      if (s.a > 1) s.a = 1;
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with gradient
    const planetGrad = ctx.createRadialGradient(CENTER.x, CENTER.y, PLANET_RADIUS * 0.3, CENTER.x, CENTER.y, PLANET_RADIUS);
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // ship (glow)
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    ship.draw();
    ctx.shadowBlur = 0;
    // asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(score)}`, W / 2, H / 2 + 20);
    }
  }

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
