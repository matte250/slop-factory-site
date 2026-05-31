// Simple Asteroid Dodge game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  const ship = {
    x: width / 2,
    y: height - 30,
    size: 20,
    speed: 5,
  };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function initAudio() {
    // resume context on first user interaction
    const resume = () => { if (audioCtx.state === 'suspended') audioCtx.resume();
      window.removeEventListener('keydown', resume);
      window.removeEventListener('mousedown', resume);
    };
    window.addEventListener('keydown', resume);
    window.addEventListener('mousedown', resume);
  }
  initAudio();
  // helper to create radial gradient for asteroids
  function asteroidGradient(a) {
    const grad = ctx.createRadialGradient(
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size * 0.2,
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size / 2
    );
    grad.addColorStop(0, '#bbb'); // brighter center
    grad.addColorStop(1, '#444'); // darker edge
    return grad;
  }
  // initialize background star field
  function initBgStars(count = 150) {
    for (let i = 0; i < count; i++) {
      bgStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
        twinkle: Math.random() * 0.02 + 0.01,
        dy: Math.random() * 0.3 + 0.1, // slight downward drift
      });
    }
  }
  // helper to create explosion particles
  function createExplosion(x, y, count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
      });
    }
    // play explosion sound
    playTone(120, 200);
  }
  // initialize once
  initBgStars();
  let asteroids = [];
  let stars = [];
  // background star field (tiny twinkling stars)
  let bgStars = [];
  // particle explosion effects
  let particles = [];
  let score = 0;
  let gameOver = false;
  let spawnTimer = 0;
  let starTimer = 0;
  let speedFactor = 1;

  // Input handling (keyboard & mouse)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    ship.y = e.clientY - rect.top;
  });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const angle = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.02; // small rotation per frame
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: (Math.random() * 1 + 0.5) * speedFactor,
      angle,
      rotationSpeed,
    });
    // subtle asteroid spawn sound
    playTone(200, 80);
  }

  function spawnStar() {
    const size = 5;
    stars.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: 2 * speedFactor,
    });
  }

  function update(dt) {
    if (gameOver) return;
    // Move ship with arrow keys if mouse not used
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // Keep ship within bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    spawnTimer += dt;
    if (spawnTimer > 800) { // ms
      spawnAsteroid();
      spawnTimer = 0;
    }
    starTimer += dt;
    if (starTimer > 1500) {
      spawnStar();
      starTimer = 0;
    }

    // Update background stars (twinkle and drift)
    bgStars.forEach(st => {
      st.alpha += (Math.random() - 0.5) * st.twinkle;
      if (st.alpha < 0.3) st.alpha = 0.3;
      if (st.alpha > 1) st.alpha = 1;
      st.y += st.dy;
      if (st.y > height) st.y = 0;
    });

    // Update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.rotationSpeed;
      // collision with ship (circle vs triangle approximated as circle)
      const dx = a.x + a.size / 2 - ship.x;
      const dy = a.y + a.size / 2 - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size / 2 + ship.size / 2) {
        gameOver = true;
        // create explosion on hit
        createExplosion(ship.x, ship.y);
      }
      if (a.y > height) {
        asteroids.splice(i, 1);
        score++;
        // gradually increase difficulty
        if (score % 10 === 0) speedFactor += 0.1;
      }
    }
    // Update stars (collect for points)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      const dx = s.x + s.size / 2 - ship.x;
      const dy = s.y + s.size / 2 - ship.y;
      if (Math.hypot(dx, dy) < s.size / 2 + ship.size / 2) {
        score += 5;
        stars.splice(i, 1);
        // star collect sound
        playTone(400, 60);
        continue;
      }
      if (s.y > height) stars.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background stars (twinkling)
    bgStars.forEach(st => {
      ctx.fillStyle = `rgba(255,255,255,${st.alpha})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Particles (explosions)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x - ship.size / 2, ship.y - ship.size / 2, ship.x + ship.size / 2, ship.y + ship.size / 2);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size / 2);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    // Asteroids with gradient and rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.angle || 0);
      ctx.fillStyle = asteroidGradient(a);
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Stars (collectibles)
    ctx.fillStyle = 'yellow';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
