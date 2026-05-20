// Simple Meteor Mail game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5
  }));

  // Game state
  const drone = { x: 100, y: canvas.height / 2, r: 15, vx: 0, vy: 0, hull: 3, fuel: 100, packages: 3 };
  const meteors = [];
  const pickups = [];
  const outposts = [];
  let lastTime = 0;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
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

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const spawnMeteor = () => {
    const size = rand(10, 30);
    meteors.push({ x: canvas.width + size, y: rand(0, canvas.height), r: size, speed: rand(2, 5) });
  };
  const spawnPickup = () => {
    pickups.push({ x: canvas.width + 20, y: rand(0, canvas.height), r: 10, type: 'fuel' });
  };
  const spawnOutpost = () => {
    const y = rand(50, canvas.height - 50);
    outposts.push({ x: canvas.width + 100, y, w: 30, h: 60, delivered: false });
  };

  // Initial spawns
  for (let i = 0; i < 5; i++) spawnMeteor();
  for (let i = 0; i < 2; i++) spawnPickup();
  for (let i = 0; i < 2; i++) spawnOutpost();

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    drone.vx = (mx - drone.x) * 0.05;
    drone.vy = (my - drone.y) * 0.05;
  });

  const update = dt => {
    // Fuel consumption
    drone.fuel = Math.max(0, drone.fuel - dt * 0.01);
    if (drone.fuel === 0) drone.hull = Math.max(0, drone.hull - dt * 0.02);

    // Controls (arrow keys)
    const accel = 0.2;
    if (keys.ArrowUp) drone.vy -= accel;
    if (keys.ArrowDown) drone.vy += accel;
    if (keys.ArrowLeft) drone.vx -= accel;
    if (keys.ArrowRight) drone.vx += accel;

    // Apply velocity and friction
    drone.x += drone.vx * dt * 0.1;
    drone.y += drone.vy * dt * 0.1;
    drone.vx *= 0.99;
    drone.vy *= 0.99;
    // Keep inside canvas
    drone.x = Math.max(drone.r, Math.min(canvas.width - drone.r, drone.x));
    drone.y = Math.max(drone.r, Math.min(canvas.height - drone.r, drone.y));

    // Move obstacles leftwards
    meteors.forEach(m => m.x -= m.speed);
    pickups.forEach(p => p.x -= 2);
    outposts.forEach(o => o.x -= 1.5);

    // Recycle off‑screen entities
    meteors.filter(m => m.x + m.r < 0).forEach(() => { meteors.splice(meteors.indexOf(m), 1); spawnMeteor(); });
    pickups.filter(p => p.x + p.r < 0).forEach(() => { pickups.splice(pickups.indexOf(p), 1); spawnPickup(); });
    outposts.filter(o => o.x + o.w < 0).forEach(() => { outposts.splice(outposts.indexOf(o), 1); spawnOutpost(); });

    // Collisions
    meteors.forEach(m => {
      const dx = m.x - drone.x, dy = m.y - drone.y;
      if (Math.hypot(dx, dy) < m.r + drone.r) {
        drone.hull = Math.max(0, drone.hull - 1);
        // bounce back a little
        drone.vx *= -0.3;
        drone.vy *= -0.3;
        playBeep(200, 0.15);
      }
    });
    pickups.forEach((p, i) => {
      const dx = p.x - drone.x, dy = p.y - drone.y;
      if (Math.hypot(dx, dy) < p.r + drone.r) {
        if (p.type === 'fuel') drone.fuel = Math.min(100, drone.fuel + 30);
        pickups.splice(i, 1);
        spawnPickup();
      }
    });
    outposts.forEach(o => {
      if (!o.delivered &&
          drone.x > o.x && drone.x < o.x + o.w &&
          drone.y > o.y && drone.y < o.y + o.h) {
        o.delivered = true;
        drone.packages = Math.max(0, drone.packages - 1);
      }
    });
  };

  const draw = () => {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a001f');
    bgGrad.addColorStop(1, '#200030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Starfield (twinkling)
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Drone – draw as a triangle pointing in movement direction
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    const angle = Math.atan2(drone.vy, drone.vx) || 0;
    const tipX = drone.x + Math.cos(angle) * drone.r * 1.5;
    const tipY = drone.y + Math.sin(angle) * drone.r * 1.5;
    const leftX = drone.x + Math.cos(angle + Math.PI * 0.75) * drone.r;
    const leftY = drone.y + Math.sin(angle + Math.PI * 0.75) * drone.r;
    const rightX = drone.x + Math.cos(angle - Math.PI * 0.75) * drone.r;
    const rightY = drone.y + Math.sin(angle - Math.PI * 0.75) * drone.r;
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();

    // Meteors – gradient gray/orange for fiery effect
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, '#b0b0b0');
      grad.addColorStop(1, '#302020');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pickups – bright orange with slight glow
    pickups.forEach(p => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'orange';
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Outposts – green rectangles with border
    outposts.forEach(o => {
      ctx.fillStyle = 'green';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#003300';
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    // UI – semi‑transparent panel
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(5, 5, 200, 30);
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Hull: ${drone.hull}  Fuel: ${Math.floor(drone.fuel)}  Packages: ${drone.packages}`, 10, 25);
    if (drone.hull <= 0 || drone.fuel <= 0) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    } else if (drone.packages === 0) {
      ctx.fillStyle = 'lime';
      ctx.font = '48px sans-serif';
      ctx.fillText('You Win!', canvas.width / 2 - 100, canvas.height / 2);
    }
  };

  const loop = timestamp => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (drone.hull > 0 && drone.fuel > 0 && drone.packages > 0) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
