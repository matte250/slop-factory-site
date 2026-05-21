// Simple Orbit Escape game with improved graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  /*** Configuration ***/
  const CONFIG = {
    // ... (existing config unchanged)
  };

   // Audio setup using Web Audio API
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   // Ensure audio context is resumed on first user interaction (required by browsers)
   const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
   window.addEventListener('click', resumeAudio);
   window.addEventListener('keydown', resumeAudio);
   function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  // ... (rest of file unchanged)
    width: 800,
    height: 600,
    ship: {
      radius: 8,
      thrust: 0.08,
      rotationSpeed: 0.05,
      maxFuel: 100,
      fuelConsume: 0.3,
      fuelGain: 20,
    },
    orb: {
      radius: 5,
      count: 5,
    },
    asteroid: {
      radius: 12,
      speed: 1.2,
      spawnInterval: 3000,
    },
    gravity: 0.2, // simple central pull
    backgroundSpeed: 0.001,
  };

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
  const ctx = canvas.getContext('2d');

  // Game state
  const ship = {
    x: CONFIG.width / 2,
    y: CONFIG.height / 2 - 150,
    vx: 0,
    vy: 0,
    angle: Math.PI / 2, // pointing upward
    fuel: CONFIG.ship.maxFuel,
    alive: true,
  };

  const orbs = [];
  const asteroids = [];
  let lastAsteroid = 0;
  let lastFrame = performance.now();
  let bgAngle = 0;

  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnOrbs() {
    while (orbs.length < CONFIG.orb.count) {
      const angle = randRange(0, Math.PI * 2);
      const dist = randRange(80, 250);
      orbs.push({
        x: CONFIG.width / 2 + Math.cos(angle) * dist,
        y: CONFIG.height / 2 + Math.sin(angle) * dist,
        collected: false,
      });
    }
  }

  function spawnAsteroid() {
    const edge = Math.floor(randRange(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const speed = CONFIG.asteroid.speed;
    switch (edge) {
      case 0:
        x = randRange(0, CONFIG.width);
        y = -CONFIG.asteroid.radius;
        break;
      case 1:
        x = CONFIG.width + CONFIG.asteroid.radius;
        y = randRange(0, CONFIG.height);
        break;
      case 2:
        x = randRange(0, CONFIG.width);
        y = CONFIG.height + CONFIG.asteroid.radius;
        break;
      case 3:
        x = -CONFIG.asteroid.radius;
        y = randRange(0, CONFIG.height);
        break;
    }
    // direction towards centre
    const dx = CONFIG.width / 2 - x;
    const dy = CONFIG.height / 2 - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy });
  }

  function update(dt) {
    if (!ship.alive) return;
    // rotation
    if (keys.ArrowLeft) ship.angle -= CONFIG.ship.rotationSpeed * dt;
    if (keys.ArrowRight) ship.angle += CONFIG.ship.rotationSpeed * dt;
    // thrust
    if (keys.ArrowUp && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * CONFIG.ship.thrust * dt;
      ship.vy += Math.sin(ship.angle) * CONFIG.ship.thrust * dt;
      ship.fuel = Math.max(0, ship.fuel - CONFIG.ship.fuelConsume * dt);
      // generate thrust particles and sound
      for (let i = 0; i < 2; i++) spawnParticle();
      playTone(400, 0.05, 'square'); // short thrust tone
    }
    // gravity toward centre
    const dx = CONFIG.width / 2 - ship.x;
    const dy = CONFIG.height / 2 - ship.y;
    const dist = Math.hypot(dx, dy);
    const gx = (dx / dist) * CONFIG.gravity * dt;
    const gy = (dy / dist) * CONFIG.gravity * dt;
    ship.vx += gx;
    ship.vy += gy;
    // move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // simple bounds wrap (prevent leaving canvas)
    if (ship.x < 0) ship.x = CONFIG.width;
    if (ship.x > CONFIG.width) ship.x = 0;
    if (ship.y < 0) ship.y = CONFIG.height;
    if (ship.y > CONFIG.height) ship.y = 0;
    // collect orbs
    for (const o of orbs) {
       if (!o.collected && Math.hypot(ship.x - o.x, ship.y - o.y) < CONFIG.ship.radius + CONFIG.orb.radius) {
         o.collected = true;
         ship.fuel = Math.min(CONFIG.ship.maxFuel, ship.fuel + CONFIG.ship.fuelGain);
         // play collection sound
         playTone(800, 0.07, 'triangle');
       }
    }
    // spawn new orbs if needed
    spawnOrbs();
    // asteroids update
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // collision with ship
        if (Math.hypot(ship.x - a.x, ship.y - a.y) < CONFIG.ship.radius + CONFIG.asteroid.radius) {
          ship.alive = false;
          // play collision sound
          playTone(200, 0.3, 'sawtooth');
        }
      // remove if passed centre
      const toCenter = Math.hypot(a.x - CONFIG.width / 2, a.y - CONFIG.height / 2);
      if (toCenter < 10) asteroids.splice(i, 1);
    }
    // asteroid spawn timer
    if (performance.now() - lastAsteroid > CONFIG.asteroid.spawnInterval) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }
    // background rotation
    bgAngle += CONFIG.backgroundSpeed * dt;
  }

  // Pre‑generated starfield for background
const stars = [];
for (let i = 0; i < 150; i++) {
  stars.push({
    x: Math.random() * CONFIG.width,
    y: Math.random() * CONFIG.height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.3,
  });
}

// Thrust particle pool
const particles = [];
function spawnParticle() {
  particles.push({
    x: ship.x,
    y: ship.y,
    vx: -Math.cos(ship.angle) * (Math.random() * 0.5 + 0.5) - ship.vx * 0.2,
    vy: -Math.sin(ship.angle) * (Math.random() * 0.5 + 0.5) - ship.vy * 0.2,
    life: 30 + Math.random() * 20,
  });
}

function draw() {
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
    // Starfield
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // rotating planet with gradient
    ctx.save();
    ctx.translate(CONFIG.width / 2, CONFIG.height / 2);
    ctx.rotate(bgAngle);
    const grad = ctx.createRadialGradient(0, 0, 80, 0, 0, 200);
    grad.addColorStop(0, '#445');
    grad.addColorStop(1, '#001');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // draw orbs with glow
    for (const o of orbs) {
      if (o.collected) continue;
      const glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, CONFIG.orb.radius * 4);
      glow.addColorStop(0, 'rgba(255,255,0,0.8)');
      glow.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(o.x, o.y, CONFIG.orb.radius * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(o.x, o.y, CONFIG.orb.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw asteroids with simple shading
    for (const a of asteroids) {
      const aGrad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, CONFIG.asteroid.radius);
      aGrad.addColorStop(0, '#aaa');
      aGrad.addColorStop(1, '#555');
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, CONFIG.asteroid.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw thrust particles
    ctx.fillStyle = 'orange';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life / 50;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // draw ship with crisp shape
    if (ship.alive) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // fuel bar
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, (ship.fuel / CONFIG.ship.maxFuel) * 100, 8);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(10, 10, 100, 8);
    if (!ship.alive) {
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', CONFIG.width / 2 - 80, CONFIG.height / 2);
    }
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key in keys) return;
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function loop(timestamp) {
    const dt = (timestamp - lastFrame) / 16; // normalize to ~60fps steps
    lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // initialise
  spawnOrbs();
  requestAnimationFrame(loop);
})();
