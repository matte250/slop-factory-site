// Orbit Escape game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function ensureAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  const cx = W/2, cy = H/2; // planet centre
  // generate background stars
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5
    });
  }

  // Ship state (polar coordinates)
  let angle = 0;
  let radius = Math.min(W, H)/4;
  let angularVel = 0.02; // rad per frame
  let radialVel = 0;
  const shipSize = 10;
  let fuel = 100;

  // Game entities
  const fuelCells = [];
  const asteroids = [];

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);

  function spawnFuel() {
    if (fuelCells.length < 3 && Math.random() < 0.01) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * Math.min(W, H) / 2 + 30;
      fuelCells.push({a, r});
    }
  }

  function spawnAsteroid() {
    if (asteroids.length < 5 && Math.random() < 0.02) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.max(W, H); // start outside view
      const speed = 0.5 + Math.random();
      asteroids.push({a, r, speed});
    }
  }

  function update() {
    // Controls – thrust with ArrowUp or Space
    if ((keys['ArrowUp'] || keys['Space']) && fuel > 0) {
      radialVel -= 0.1; // push outward (increase radius)
      fuel -= 0.3;
    }
    // natural gravity pulls inward
    radialVel += 0.02; // gravity
    radius += radialVel;
    // keep angle rotating
    angle += angularVel;
    // simple bounds
    if (radius < 20) { radius = 20; radialVel = 0; }
    if (radius > Math.min(W, H)/2) { radius = Math.min(W, H)/2; radialVel = 0; }

    // Update asteroids (move inward)
    asteroids.forEach(a => {
      a.r -= a.speed;
      a.a += 0.005; // slight rotation
    });
    // Remove passed asteroids
    for (let i = asteroids.length-1; i>=0; i--) {
      if (asteroids[i].r < 10) asteroids.splice(i,1);
    }

    // Check collisions with asteroids
    for (const ast of asteroids) {
      const dx = (cx + radius*Math.cos(angle)) - (cx + ast.r*Math.cos(ast.a));
      const dy = (cy + radius*Math.sin(angle)) - (cy + ast.r*Math.sin(ast.a));
      const dist = Math.hypot(dx, dy);
      if (dist < shipSize + 8) {
        // Game over – stop animation
        cancelAnimationFrame(frameId);
        alert('Game Over');
        return;
      }
    }

    // Check fuel cells collection
    for (let i = fuelCells.length-1; i>=0; i--) {
      const fc = fuelCells[i];
      const dx = (cx + radius*Math.cos(angle)) - (cx + fc.r*Math.cos(fc.a));
      const dy = (cy + radius*Math.sin(angle)) - (cy + fc.r*Math.sin(fc.a));
      if (Math.hypot(dx, dy) < shipSize + 5) {
        fuel = Math.min(100, fuel + 20);
        fuelCells.splice(i,1);
      }
    }

    // Decrease fuel slowly
    fuel = Math.max(0, fuel - 0.02);
    if (fuel <= 0) {
      cancelAnimationFrame(frameId);
      alert('Out of fuel');
      return;
    }

    spawnFuel();
    spawnAsteroid();
    draw();
    frameId = requestAnimationFrame(update);
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    // planet
    ctx.fillStyle = '#223';
    ctx.beginPath();
    ctx.arc(cx,cy,30,0,Math.PI*2);
    ctx.fill();
    // ship
    const sx = cx + radius*Math.cos(angle);
    const sy = cy + radius*Math.sin(angle);
    const dir = angle + Math.PI/2; // point forward
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(sx + shipSize*Math.cos(dir), sy + shipSize*Math.sin(dir));
    ctx.lineTo(sx + shipSize*Math.cos(dir+2.5), sy + shipSize*Math.sin(dir+2.5));
    ctx.lineTo(sx + shipSize*Math.cos(dir-2.5), sy + shipSize*Math.sin(dir-2.5));
    ctx.closePath();
    ctx.fill();
    // fuel cells
    ctx.fillStyle = '#ff0';
    fuelCells.forEach(fc => {
      ctx.beginPath();
      ctx.arc(cx + fc.r*Math.cos(fc.a), cy + fc.r*Math.sin(fc.a), 5,0,Math.PI*2);
      ctx.fill();
    });
    // asteroids
    ctx.fillStyle = '#a55';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(cx + a.r*Math.cos(a.a), cy + a.r*Math.sin(a.a), 8,0,Math.PI*2);
      ctx.fill();
    });
    // fuel bar
    ctx.fillStyle = '#fff';
    ctx.fillRect(10,10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10,10, fuel, 10);
  }

  let frameId = requestAnimationFrame(update);
})();
