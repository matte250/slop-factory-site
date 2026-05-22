// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML page.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Background hum (simple low pulse)
  setInterval(() => playTone(100, 0.2), 3000);
  // Simple sound effects for events
  function playEffect(event) {
    switch(event) {
      case 'thrust':
        playTone(300, 0.05);
        break;
      case 'collect':
        playTone(600, 0.1);
        break;
      case 'crash':
        playTone(150, 0.3);
        break;
    }
  }

  // Set canvas size to fill the window
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ----- Game state -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height * 0.8,
    radius: 15,
    speed: 4,
    fuel: 100,
    alive: true,
  };
  let score = 0;
  const asteroids = [];
  const fuels = [];
  const keys = {};
  // starfield background
  const stars = [];
  const STAR_COUNT = 200;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // ----- Helper functions -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnAsteroid() {
    const size = rand(20, 50);
    asteroids.push({
      x: rand(size, canvas.width - size),
      y: -size,
      radius: size,
      speed: rand(2, 5),
    });
  }

  function spawnFuel() {
    const size = 10;
    fuels.push({
      x: rand(size, canvas.width - size),
      y: -size,
      radius: size,
      speed: 2,
    });
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.PI / 2);
    // ship gradient (blue glowing)
    const grad = ctx.createRadialGradient(0, 0, ship.radius * 0.2, 0, 0, ship.radius);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#007');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-ship.radius, ship.radius);
    ctx.lineTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCircle(obj, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function update() {
    // Input
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.y -= ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed;

    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // Fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) ship.alive = false;

    // Spawn obstacles & fuel cells
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship
      if (dist(a, ship) < a.radius + ship.radius) { playEffect('crash'); ship.alive = false; }
      // Remove off‑screen
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
    }

    // Move fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (dist(f, ship) < f.radius + ship.radius) {
        ship.fuel = Math.min(100, ship.fuel + 20);
        score += 10;
        fuels.splice(i, 1);
        playEffect('collect');
        continue;
      }
      if (f.y - f.radius > canvas.height) fuels.splice(i, 1);
    }
    // Move stars for parallax effect
    for (let s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars (twinkling)
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship
    drawShip();
    // Draw asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw fuel cells with glow
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.radius * 0.2, f.x, f.y, f.radius);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#880');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (!ship.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (ship.alive) {
      update();
    }
    render();
    requestAnimationFrame(loop);
  }

  // ----- Input handling -----
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // play thrust sound on movement keys
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)) playEffect('thrust');
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Resize handling
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Start game
  loop();
})();
