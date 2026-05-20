// Space Dodger game
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Starfield background
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * 0.5 + 0.5
  }));

  // Ship definition with outline
  // Also generate starfield background
  const ship = {
    x: width / 2,
    y: height - 40,
    size: 20,
    speed: 5,
    dx: 0,
    dy: 0,
    update() {
      this.x = Math.max(this.size, Math.min(width - this.size, this.x + this.dx));
      this.y = Math.max(this.size, Math.min(height - this.size, this.y + this.dy));
    },
    draw() {
      // Ship gradient fill
      const grad = ctx.createLinearGradient(this.x - this.size, this.y, this.x + this.size, this.y);
      grad.addColorStop(0, '#00f');
      grad.addColorStop(1, '#0ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
      // Outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  // Asteroid handling
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  const maxAsteroidSpeed = 3;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size * 2) + size;
    const y = -size;
    const speed = Math.random() * maxAsteroidSpeed + 1;
    asteroids.push({ x, y, size, speed });
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction (required by some browsers)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    ship.dx = 0; ship.dy = 0;
    let moved = false;
    if (keys['ArrowLeft']) { ship.dx = -ship.speed; moved = true; }
    if (keys['ArrowRight']) { ship.dx = ship.speed; moved = true; }
    if (keys['ArrowUp']) { ship.dy = -ship.speed; moved = true; }
    if (keys['ArrowDown']) { ship.dy = ship.speed; moved = true; }
    if (moved) beep(440, 0.05); // short thrust sound
  }

  function update() {
    handleInput();
    ship.update();
    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
    // Collision detection (circle‑to‑triangle approximated by distance to ship center)
    for (const a of asteroids) {
      const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
      if (dist < a.size + ship.size) {
          cancelAnimationFrame(animId);
          beep(150, 0.5); // collision sound
          alert('Game Over');
          return;
      }
    }
  }

  function draw() {
    // Fade previous frame for motion trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    // Draw starfield (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      // simple twinkle effect by modulating radius
      const r = s.radius * (0.8 + Math.random() * 0.4);
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ship.draw();
    // Asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Start game loop and asteroid spawning
  let animId = requestAnimationFrame(loop);
  const spawnTimer = setInterval(spawnAsteroid, asteroidSpawnInterval);
})();
