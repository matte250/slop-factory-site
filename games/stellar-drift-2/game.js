// Minimalist "Stellar Drift" game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  const cx = W/2, cy = H/2; // planet centre

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const ensureAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  };
  const playThrust = () => { ensureAudio(); playTone(400, 80); };
  const playGameOver = () => { ensureAudio(); playTone(150, 300); };

  // Ship state (polar coordinates around centre)
  let ship = {angle: 0, radius: 120, vr: 0}; // vr = radial velocity
  const GRAVITY = -0.02; // pulls toward centre (negative radius accel)
  const THRUST = 0.5; // outward velocity on click
  const MIN_RADIUS = 30; // crash into planet

  // Asteroids
  const asteroids = [];
  const ASTEROID_RATE = 1500; // ms
  const ASTEROID_SPEED = 1.5;
  const ASTEROID_RADIUS = 10;

  let lastAst = 0, start = performance.now(), score = 0;

  const spawnAsteroid = () => {
    const side = Math.floor(Math.random()*4);
    let x, y, vx, vy;
    if (side===0) {x=0; y=Math.random()*H; vx=ASTEROID_SPEED; vy=(Math.random()-0.5)*ASTEROID_SPEED;}
    else if (side===1) {x=W; y=Math.random()*H; vx=-ASTEROID_SPEED; vy=(Math.random()-0.5)*ASTEROID_SPEED;}
    else if (side===2) {x=Math.random()*W; y=0; vx=(Math.random()-0.5)*ASTEROID_SPEED; vy=ASTEROID_SPEED;}
    else {x=Math.random()*W; y=H; vx=(Math.random()-0.5)*ASTEROID_SPEED; vy=-ASTEROID_SPEED;}
    asteroids.push({x,y,vx,vy,r:ASTEROID_RADIUS});
  };

  const update = (dt) => {
    // ship physics
    ship.vr += GRAVITY * dt;
    ship.radius += ship.vr * dt;
    ship.angle += 0.001 * dt; // slow rotation for visual effect
    if (ship.radius < MIN_RADIUS) ship.radius = MIN_RADIUS;

    // asteroids motion
    for (let i=asteroids.length-1;i>=0;i--) {
      const a = asteroids[i];
      a.x += a.vx*dt;
      a.y += a.vy*dt;
      // remove if out of bounds
      if (a.x< -50||a.x>W+50||a.y<-50||a.y>H+50) asteroids.splice(i,1);
    }

    // collision detection
    const sx = cx + Math.cos(ship.angle)*ship.radius;
    const sy = cy + Math.sin(ship.angle)*ship.radius;
    for (const a of asteroids) {
      const dx = a.x - sx, dy = a.y - sy;
      if (Math.hypot(dx,dy) < a.r+5) {
        // game over
        playGameOver();
        alert('Game Over! Score: ' + Math.floor(score/1000) + 's');
        window.location.reload();
        return;
      }
    }
  };

  // generate static starfield
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5});
  }

  const draw = () => {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI); ctx.fill();
    }
    // planet with gradient
    const planetGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 30);
    planetGrad.addColorStop(0, '#445');
    planetGrad.addColorStop(1, '#112');
    ctx.fillStyle = planetGrad;
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 2 * Math.PI); ctx.fill();
    // ship as triangle
    const sx = cx + Math.cos(ship.angle) * ship.radius;
    const sy = cy + Math.sin(ship.angle) * ship.radius;
    const shipSize = 8;
    const dir = ship.angle;
    const p1 = {x: sx + Math.cos(dir) * shipSize, y: sy + Math.sin(dir) * shipSize};
    const p2 = {x: sx + Math.cos(dir + Math.PI * 0.75) * shipSize * 0.6, y: sy + Math.sin(dir + Math.PI * 0.75) * shipSize * 0.6};
    const p3 = {x: sx + Math.cos(dir - Math.PI * 0.75) * shipSize * 0.6, y: sy + Math.sin(dir - Math.PI * 0.75) * shipSize * 0.6};
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    // asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#a66');
      grad.addColorStop(1, '#422');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI); ctx.fill();
    }
    // score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + (score/1000).toFixed(1) + 's', 10, 20);
  };

  const loop = (now) => {
    const dt = (now - (lastAst||now)) / 16; // approx 60fps scaling
    if (now - lastAst > ASTEROID_RATE) {spawnAsteroid(); lastAst = now;}
    update(dt);
    draw();
    score = now - start;
    requestAnimationFrame(loop);
  };

  canvas.addEventListener('click', () => { ship.vr -= THRUST; playThrust(); });
  requestAnimationFrame(loop);
})();
