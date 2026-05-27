// Minimal Asteroid Miner game
// Canvas with id="game" must exist in the page.
(() => {
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (type) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    let freq = 440;
    let dur = 0.1;
    switch (type) {
      case 'laser':
        freq = 800; dur = 0.07; break;
      case 'hit':
        freq = 200; dur = 0.2; break;
      case 'gameover':
        freq = 100; dur = 0.5; break;
    }
    o.frequency.value = freq;
    o.start();
    o.stop(audioCtx.currentTime + dur);
  };

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Enhanced graphics setup
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }
  const lasers = [];
  const addLaser = (x, y) => {
    lasers.push({ x, y, life: 0.3 }); // seconds
  };

  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Game state
  const ship = { x: width / 2, y: height / 2, vx: 0, vy: 0, size: 15, angle: 0, hp: 100 };
  const asteroids = [];
  const drones = [];
  let resources = 0;
  const keys = {};

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const addAsteroid = () => {
    const r = rand(20, 50);
    asteroids.push({ x: rand(0, width), y: rand(0, height), r, rot: rand(0, Math.PI * 2), speed: rand(0.5, 2) });
  };
  const addDrone = () => {
    const size = 20;
    drones.push({ x: rand(0, width), y: rand(0, height), size, dir: rand(0, Math.PI * 2), speed: 1.5 });
  };

  // Populate initial objects
  for (let i = 0; i < 10; i++) addAsteroid();
  for (let i = 0; i < 3; i++) addDrone();

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('click', e => {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Play laser sound
    playSound('laser');
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Laser visual
    addLaser(mx, my);
    // Simple laser: remove first asteroid under cursor
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      const dx = mx - a.x,
        dy = my - a.y;
      if (dx * dx + dy * dy < a.r * a.r) {
        asteroids.splice(i, 1);
        resources++;
        addAsteroid();
        break;
      }
    }
  });

  // Game loop
  function update(dt) {
    const speed = 150; // pixels per second
    // Update velocity based on input
    ship.vx = 0; ship.vy = 0;
    if (keys.ArrowUp || keys.w) ship.vy -= speed;
    if (keys.ArrowDown || keys.s) ship.vy += speed;
    if (keys.ArrowLeft || keys.a) ship.vx -= speed;
    if (keys.ArrowRight || keys.d) ship.vx += speed;
    // Apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Update ship angle to point direction of movement (if any)
    if (ship.vx !== 0 || ship.vy !== 0) ship.angle = Math.atan2(ship.vy, ship.vx);
    // Keep ship inside bounds (wrap)
    ship.x = (ship.x + width) % width;
    ship.y = (ship.y + height) % height;

    // Move asteroids (slow drift)
    asteroids.forEach(a => {
      a.x += Math.cos(a.rot) * a.speed;
      a.y += Math.sin(a.rot) * a.speed;
      // wrap
      if (a.x < -a.r) a.x = width + a.r;
      if (a.x > width + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = height + a.r;
      if (a.y > height + a.r) a.y = -a.r;
      // collision with ship
      const dx = ship.x - a.x,
        dy = ship.y - a.y;
      if (dx * dx + dy * dy < (ship.size + a.r) ** 2) {
        ship.hp = Math.max(0, ship.hp - 10);
        playSound('hit');
      }
    });

    // Move drones (simple back‑and‑forth)
    drones.forEach(d => {
      d.x += Math.cos(d.dir) * d.speed;
      d.y += Math.sin(d.dir) * d.speed;
      if (d.x < 0 || d.x > width || d.y < 0 || d.y > height) d.dir += Math.PI; // bounce
      // collision with ship
      const dx = ship.x - d.x,
        dy = ship.y - d.y;
      if (dx * dx + dy * dy < (ship.size + d.size) ** 2) {
        ship.hp = Math.max(0, ship.hp - 20);
        playSound('hit');
      }
    });

    // Update lasers (fade out)
    lasers.forEach(l => l.life -= dt);
    // Remove expired lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].life <= 0) lasers.splice(i, 1);
    }
  }

  function draw() {
    // Starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Lasers
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x, l.y - 15);
      ctx.stroke();
    });

    // Ship
    ctx.save();
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

    // Asteroids with simple shading
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      // radial gradient for depth
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.3, 0, 0, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Drones
    ctx.fillStyle = 'red';
    drones.forEach(d => {
      ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
    });

    // UI overlay
    ctx.fillStyle = 'lime';
    ctx.font = '16px monospace';
    ctx.fillText('Resources: ' + resources, 10, 20);
    ctx.fillStyle = 'orange';
    ctx.fillRect(10, 30, ship.hp * 2, 10);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(10, 30, 200, 10);
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    if (ship.hp > 0) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
} else {
        // Ensure audio context is running
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playSound('gameover');
        ctx.fillStyle = 'red';
        ctx.font = '48px sans-serif';
        ctx.fillText('Game Over', width / 2 - 120, height / 2);
      }
  }
  requestAnimationFrame(loop);
})();
