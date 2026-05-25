// Canvas Asteroid Dodge simple implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
// generate simple starfield
const stars = Array.from({length: 120}, () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 1.5 + 0.5
}));
// audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// unlock audio on user interaction
window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });
window.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}
function playThrust() { playTone(300, 0.1); }
function playExplosion() { playTone(80, 0.5); }
function playCollect() { playTone(600, 0.2); }

  // Ship
  const ship = { x: width / 2, y: height / 2, radius: 10, speed: 4, dx: 0, dy: 0 };
  const particles = []; // thrust particles
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const ASTEROID_COUNT = 5;
  const ASTEROID_MIN_SPEED = 1;
  const ASTEROID_MAX_SPEED = 3;

  function spawnAsteroid() {
    // add rotation properties
    const edge = Math.floor(Math.random() * 4); // 0=top,1=right,2=bottom,3=left
    let x, y, dx, dy;
    const radius = 15 + Math.random() * 15;
    const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    const angle = Math.random() * Math.PI * 2;
    const angularVel = (Math.random() - 0.5) * 0.04;
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -radius; dx = (Math.random() - 0.5) * speed; dy = speed; break;
      case 1: // right
        x = width + radius; y = Math.random() * height; dx = -speed; dy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * width; y = height + radius; dx = (Math.random() - 0.5) * speed; dy = -speed; break;
      case 3: // left
        x = -radius; y = Math.random() * height; dx = speed; dy = (Math.random() - 0.5) * speed; break;
    }
    asteroids.push({ x, y, dx, dy, radius, angle, angularVel });
    return;
  }
  // original spawn logic removed
    const edge = Math.floor(Math.random() * 4); // 0=top,1=right,2=bottom,3=left
    let x, y, dx, dy;
    const radius = 15 + Math.random() * 15;
    const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -radius; dx = (Math.random() - 0.5) * speed; dy = speed; break;
      case 1: // right
        x = width + radius; y = Math.random() * height; dx = -speed; dy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * width; y = height + radius; dx = (Math.random() - 0.5) * speed; dy = -speed; break;
      case 3: // left
        x = -radius; y = Math.random() * height; dx = speed; dy = (Math.random() - 0.5) * speed; break;
    }
    asteroids.push({ x, y, dx, dy, radius });
  }

  for (let i = 0; i < ASTEROID_COUNT; i++) spawnAsteroid();

  // Fuel cells (optional simple points)
  const fuels = [];
  function spawnFuel() {
    const radius = 8;
    const x = Math.random() * (width - 2 * radius) + radius;
    const y = Math.random() * (height - 2 * radius) + radius;
    fuels.push({ x, y, radius, collected: false });
  }
  spawnFuel();

  let fuel = 100; // start fuel, decrement each frame
  let score = 0;
  let gameOver = false;

  function update() {
    // thrust particles when moving and thrust sound
    if (ship.dx !== 0 || ship.dy !== 0) {
      playThrust();
      for (let i = 0; i < 2; i++) {
        const angle = Math.atan2(ship.dy, ship.dx) + Math.PI; // opposite direction
        const speed = Math.random() * 1 + 0.5;
        particles.push({
          x: ship.x - Math.cos(angle) * ship.radius,
          y: ship.y - Math.sin(angle) * ship.radius,
          dx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
          dy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
          life: 30,
          size: Math.random() * 2 + 1,
          color: 'rgba(255,165,0,0.8)'
        });
      }
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx; p.y += p.dy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // ship movement
    ship.dx = ship.dy = 0;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y + ship.dy));

    // asteroids movement & bounce
    asteroids.forEach(a => {
      a.x += a.dx; a.y += a.dy;
      if (a.x < a.radius || a.x > width - a.radius) a.dx *= -1;
      if (a.y < a.radius || a.y > height - a.radius) a.dy *= -1;
    });

    // collision detection
    for (const a of asteroids) {
      const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
        if (dist < a.radius + ship.radius) {
          playExplosion();
          gameOver = true; return;
        }
    }
    // fuel cell collection
    fuels.forEach(f => {
      if (!f.collected) {
        const d = Math.hypot(f.x - ship.x, f.y - ship.y);
        if (d < f.radius + ship.radius) {
          f.collected = true;
          score += 10;
          fuel = Math.min(100, fuel + 20);
        }
      }
    });
    // consume fuel
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // space background with gradient
    const bgGrad = ctx.createLinearGradient(0,0,width,height);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // draw stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // ship (triangle) with stroke
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // asteroids (rotating rocks)
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      // draw irregular polygon approximating rock
      const points = 8;
      for (let i = 0; i < points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const r = a.radius * (0.7 + Math.random() * 0.3);
        const px = Math.cos(theta) * r;
        const py = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // fuels
    ctx.fillStyle = 'yellow';
    fuels.forEach(f => {
      if (!f.collected) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }
  // start
  loop();
})();
