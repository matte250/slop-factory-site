// Asteroid Rescue – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context resumes on first interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // ----- Game state -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: 10,
    fuel: 100,
  };

  const asteroids = [];
  const pods = [];
  const stars = [];
  const thrustParticles = [];
  let score = 0;
  let lastSpawn = 0;

  // Initialize starfield
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      alpha: Math.random(),
    });
  }

  // ----- Utils -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.code] = true));
  window.addEventListener('keyup', (e) => (keys[e.code] = false));

  // ----- Game Loop -----
  function update(dt) {
    // Ship controls – ArrowUp thrust
    if (keys['ArrowUp'] && ship.fuel > 0) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel = Math.max(0, ship.fuel - 0.02 * dt);
      // Emit thrust particle at ship rear
      const px = ship.x - Math.cos(ship.angle) * 12;
      const py = ship.y - Math.sin(ship.angle) * 12;
      thrustParticles.push({ x: px, y: py, life: 1 });
      // Play thrust sound
      playTone(300, 0.05, 'sine');
    }
    // Left / Right rotation
    if (keys['ArrowLeft']) ship.angle -= 0.03 * dt;
    if (keys['ArrowRight']) ship.angle += 0.03 * dt;

    // Apply inertia (simple drag)
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Wrap around screen
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Spawn asteroids & pods every 2 seconds
    const now = performance.now();
    if (now - lastSpawn > 2000) {
      lastSpawn = now;
      // Asteroid
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.05, 0.2);
      asteroids.push({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: rand(15, 30),
      });
      // Pod (smaller, slower)
      pods.push({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        radius: 6,
        collected: false,
      });
    }

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < 0) a.x += canvas.width;
      if (a.x > canvas.width) a.x -= canvas.width;
      if (a.y < 0) a.y += canvas.height;
      if (a.y > canvas.height) a.y -= canvas.height;
    }

    // Check collisions – ship vs asteroid
    for (const a of asteroids) {
      if (distance(ship, a) < ship.radius + a.radius) {
        // Play crash sound
        playTone(150, 0.3, 'sawtooth');
        // Game over – stop loop
        alert(`Game over! Score: ${score}`);
        document.location.reload();
        return;
      }
    }

    // Check ship vs pod
    for (const p of pods) {
      if (!p.collected && distance(ship, p) < ship.radius + p.radius) {
        p.collected = true;
        score += 10;
        // Play collection sound
        playTone(600, 0.07, 'triangle');
      }
    }
  }

  function draw() {
    // Background stars
    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Thrust particles
    for (let i = thrustParticles.length - 1; i >= 0; i--) {
      const p = thrustParticles[i];
      ctx.fillStyle = `rgba(255,165,0,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      p.life -= 0.02;
      if (p.life <= 0) thrustParticles.splice(i, 1);
    }

    // Ship (triangle with gradient)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createLinearGradient(0, -12, 0, 12);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, '#0bf');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#0cf';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Asteroids (irregular polygons)
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation || 0);
      ctx.beginPath();
      const points = 8;
      const step = (Math.PI * 2) / points;
      for (let i = 0; i < points; i++) {
        const r = a.radius * (0.7 + Math.random() * 0.3);
        ctx.lineTo(Math.cos(i * step) * r, Math.sin(i * step) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Pods (glowing gradient)
    for (const p of pods) {
      if (p.collected) continue;
      const podGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      podGrad.addColorStop(0, '#0f0');
      podGrad.addColorStop(1, '#030');
      ctx.fillStyle = podGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD – fuel & score
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
  }

  let last = performance.now();
  function loop(time) {
    const dt = (time - last) / 16; // normalise to ~60fps units
    last = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
