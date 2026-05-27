// Neon Light Runner – minimal implementation
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // Sound effects (tiny wav data URIs)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA=');
  const collectSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA=');
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA=');

  // Game state
  let score = 0;
  let energy = 1; // 0‑1 range
  let lastTime = 0;
  const ship = {x: 80, y: H/2, w: 30, h: 20, vy: 0, gravity: 0.4, jump: -8};
  const obstacles = [];
  const orbs = [];

  // Input – tap / click to ascend
  const onPress = () => { ship.vy = ship.jump; jumpSound.play(); };
  canvas.addEventListener('mousedown', onPress);
  canvas.addEventListener('touchstart', onPress);

  // Helper functions
  const rectCollide = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const spawnObstacle = () => {
    const size = 20 + Math.random()*30;
    obstacles.push({x: W, y: H - size, w: size, h: size, speed: 4 + Math.random()*2});
  };
  const spawnOrb = () => {
    const r = 8;
    const y = Math.random() * (H - 2*r) + r;
    orbs.push({x: W, y, r, speed: 3});
  };

  // Main loop
  function update(dt) {
    // Ship physics
    ship.vy += ship.gravity;
    ship.y += ship.vy;
    if (ship.y + ship.h > H) { ship.y = H - ship.h; ship.vy = 0; }
    if (ship.y < 0) { ship.y = 0; ship.vy = 0; }

    // Move obstacles & orbs
    obstacles.forEach(o => o.x -= o.speed);
    orbs.forEach(o => o.x -= o.speed);
    // Remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (orbs.length && orbs[0].x + orbs[0].r < 0) orbs.shift();

    // Spawn logic
    if (Math.random() < 0.02) spawnObstacle();
    if (Math.random() < 0.015) spawnOrb();

    // Collision detection
    for (const o of obstacles) {
      if (rectCollide(ship, o)) { energy = 0; hitSound.play(); }
    }
    for (let i=orbs.length-1;i>=0;i--) {
      const orb = orbs[i];
      const dx = (ship.x + ship.w/2) - orb.x;
      const dy = (ship.y + ship.h/2) - orb.y;
        if (dx*dx + dy*dy < (orb.r+10)*(orb.r+10)) { // collect
          orbs.splice(i,1);
          energy = Math.min(1, energy + 0.1);
          score += 10;
          collectSound.play();
        }
    }
    // Energy drain
    energy -= dt * 0.0002;
    if (energy <= 0) { // Game over – reset
      alert('Game Over! Score: ' + Math.floor(score));
      score = 0; energy = 1; ship.y = H/2; ship.vy = 0; obstacles.length = 0; orbs.length = 0;
    }
    score += dt * 0.01;
  }

  function draw() {
    // Background gradient (dark to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Neon ship – triangle with glow
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.lineTo(0, -ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Obstacles – spikes with neon red glow
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f44';
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.beginPath();
      ctx.moveTo(-o.w / 2, o.h / 2);
      ctx.lineTo(o.w / 2, o.h / 2);
      ctx.lineTo(0, -o.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.shadowBlur = 0; // reset blur for orbs

    // Orbs – glowing yellow circles with radial gradient
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(0.6, '#ff0');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI – score & energy bar
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 30, energy*100, 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10,30,100,10);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
