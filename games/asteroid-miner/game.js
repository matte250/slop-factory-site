// Simple Asteroid Miner game with improved graphics and sounds
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
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
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  // Star field background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5
  }));
  // Explosion particles
  const explosions = [];
  function addExplosion(x, y) {
    // play explosion sound with random pitch
    const freq = 200 + Math.random() * 200;
    playTone(freq, 0.2);
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 30 + Math.random() * 20,
        size: 2 + Math.random() * 2,
        hue: Math.floor(Math.random() * 360)
      });
    }
    explosions.push(particles);
  }
  let score = 0;
  let health = 3; // ship hull integrity (3 lives)
  const keys = {};
  const lasers = [];
  const asteroids = [];
  const ores = [];

  // ----- Player ship -----
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 40,
    h: 20,
    speed: 4,
draw() {
    const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y, this.x + this.w / 2, this.y + this.h);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#080');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.w / 2, this.y + this.h);
    ctx.lineTo(this.x + this.w / 2, this.y + this.h);
    ctx.closePath();
    ctx.fill();
  }
  };

  // ----- Helper functions -----
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size,
      speed: Math.random() * 1.5 + 0.5
    });
  }

  function spawnOre() {
    const size = 10;
    ores.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size,
      speed: 2
    });
  }

  function fireLaser() {
    // play laser sound
    playTone(600, 0.08);
    lasers.push({
      x: ship.x,
      y: ship.y,
      w: 2,
      h: 10,
      speed: 6
    });
  }

  function rectCircleCollide(rect, circle) {
    // simple AABB vs circle collision
    const distX = Math.abs(circle.x - rect.x);
    const distY = Math.abs(circle.y - rect.y);
    if (distX > (rect.w / 2 + circle.r)) { return false; }
    if (distY > (rect.h / 2 + circle.r)) { return false; }
    if (distX <= (rect.w / 2)) { return true; }
    if (distY <= (rect.h / 2)) { return true; }
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
  }

  // ----- Input -----
  window.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') { e.preventDefault(); fireLaser(); } });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Main loop -----
  let lastAsteroid = 0, lastOre = 0;
  function update(dt) {
    // scroll star field
    const starSpeed = 0.3;
    for (let s = stars.length - 1; s >= 0; s--) {
      const st = stars[s];
      st.y += starSpeed;
      if (st.y > height) {
        st.y = 0;
        st.x = Math.random() * width;
      }
    }
    // update explosions
    for (let e = explosions.length - 1; e >= 0; e--) {
      const particles = explosions[e];
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
      }
      if (particles.length === 0) explosions.splice(e, 1);
    }
    // move ship
    if (keys['ArrowLeft'] && ship.x - ship.w / 2 > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w / 2 < width) ship.x += ship.speed;
    if (keys['ArrowUp'] && ship.y - ship.h > 0) ship.y -= ship.speed;
    if (keys['ArrowDown'] && ship.y + ship.h < height) ship.y += ship.speed;

    // update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y < 0) lasers.splice(i, 1);
    }

    // spawn asteroids/ores periodically
    if (performance.now() - lastAsteroid > 1200) { spawnAsteroid(); lastAsteroid = performance.now(); }
    if (performance.now() - lastOre > 1800) { spawnOre(); lastOre = performance.now(); }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
if (rectCircleCollide(shipRect, a)) {
          health--;
          addExplosion(a.x, a.y);
          asteroids.splice(i, 1);
          continue;
      }
      // collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (rectCircleCollide({ x: l.x, y: l.y, w: l.w, h: l.h }, a)) {
          score += 10;
          addExplosion(a.x, a.y);
          playTone(800, 0.1);
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }
      // remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // update ores
    for (let i = ores.length - 1; i >= 0; i--) {
      const o = ores[i];
      o.y += o.speed;
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      if (rectCircleCollide(shipRect, o)) {
        score += 5;
        ores.splice(i, 1);
        continue;
      }
      if (o.y - o.r > height) ores.splice(i, 1);
    }
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw star field
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.r, s.r));
    // draw ship
    ship.draw();
    // draw lasers
    ctx.fillStyle = '#ff0';
    lasers.forEach(l => ctx.fillRect(l.x - l.w / 2, l.y, l.w, l.h));
    // draw asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw ores with glow
    ores.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#004');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw explosions
    explosions.forEach(particles => {
      particles.forEach(p => {
        ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    // UI: score and health
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Health: ' + health, 10, 40);
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (health > 0) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 60);
    }
  }

  // start the game
  requestAnimationFrame(loop);
})();
