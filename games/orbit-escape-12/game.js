// Simple orbit escape game with enhanced graphics
// Targets <canvas id="game">.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // generate background stars (static positions, twinkle via alpha)
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    radius: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * 0.5 + 0.5
  }));

  // audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
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

  // planet at center (gradient for depth)
  const planet = { x: W / 2, y: H / 2, r: 30 };

  // ship state (triangle shape)
  const ship = {
    angle: 0, // radians
    radius: 120,
    speed: 0.02, // angular speed per frame
    boost: 0.04,
    shield: 3,
    size: 8,
    color: '#0ff'
  };

  // input handling
  const keys = {};
  let audioStarted = false;
  function unlockAudio() { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } }
  window.addEventListener('keydown', e => { unlockAudio(); keys[e.key] = true; });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // asteroids and power‑ups
  const asteroids = [];
  const powerUps = [];
  let asteroidTimer = 0;
  let powerTimer = 0;

  function spawnAsteroid() {
    // spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1.5 + Math.random();
    if (side === 0) { x = 0; y = Math.random() * H; }
    else if (side === 1) { x = W; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = 0; }
    else { x = Math.random() * W; y = H; }
    // direction toward planet
    const dx = planet.x - x;
    const dy = planet.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, r: 6 });
  }

  function spawnPowerUp() {
    const angle = Math.random() * Math.PI * 2;
    const dist = planet.r + 30 + Math.random() * 80;
    const x = planet.x + Math.cos(angle) * dist;
    const y = planet.y + Math.sin(angle) * dist;
    powerUps.push({ x, y, r: 5, type: Math.random() < 0.5 ? 'speed' : 'shield' });
  }

  function update() {
    // ship control
    if (keys.ArrowLeft) ship.angle -= ship.speed;
    if (keys.ArrowRight) ship.angle += ship.speed;
    if (keys.ArrowUp) ship.radius = Math.max(planet.r + 20, ship.radius - 0.5);
    if (keys.ArrowDown) ship.radius = Math.min(Math.min(W, H) / 2 - 10, ship.radius + 0.5);
    // boost using space
    const moveSpeed = keys[' '] ? ship.boost : ship.speed;
    if (keys.ArrowLeft) ship.angle -= moveSpeed;
    if (keys.ArrowRight) ship.angle += moveSpeed;

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // collision with planet (optional) - remove
      if (Math.hypot(a.x - planet.x, a.y - planet.y) < planet.r) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision with ship
      const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
      const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
      if (Math.hypot(a.x - shipX, a.y - shipY) < a.r + ship.size) {
        ship.shield--;
        // play hit sound
        beep(200, 0.1);
        asteroids.splice(i, 1);
        if (ship.shield <= 0) {
          alert('Game Over');
          // reset
          ship.shield = 3;
          asteroids.length = 0;
          powerUps.length = 0;
          ship.angle = 0;
          ship.radius = 120;
          return;
        }
      }
    }

    // power‑up collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
      const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
if (Math.hypot(p.x - shipX, p.y - shipY) < p.r + ship.size) {
          if (p.type === 'shield') {
            ship.shield = Math.min(5, ship.shield + 1);
            beep(400, 0.1);
          } else if (p.type === 'speed') {
            ship.speed = Math.min(0.06, ship.speed + 0.005);
            beep(600, 0.1);
          }
          powerUps.splice(i, 1);
        }
    }

    // spawning timers
    if (++asteroidTimer > 60) { // ~1 per second at 60fps
      asteroidTimer = 0;
      spawnAsteroid();
    }
    if (++powerTimer > 300) { // ~5 seconds
      powerTimer = 0;
      spawnPowerUp();
    }
  }

function draw() {
    ctx.clearRect(0, 0, W, H);
    // background stars (twinkle)
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.twinkle})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x, planet.y, planet.r * 0.3,
      planet.x, planet.y, planet.r
    );
    planetGrad.addColorStop(0, '#555');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // ship as triangle
    const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
    const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
    const dir = ship.angle;
    const size = ship.size;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(
      shipX + Math.cos(dir) * size,
      shipY + Math.sin(dir) * size
    );
    ctx.lineTo(
      shipX + Math.cos(dir + Math.PI * 0.75) * size * 0.6,
      shipY + Math.sin(dir + Math.PI * 0.75) * size * 0.6
    );
    ctx.lineTo(
      shipX + Math.cos(dir - Math.PI * 0.75) * size * 0.6,
      shipY + Math.sin(dir - Math.PI * 0.75) * size * 0.6
    );
    ctx.closePath();
    ctx.fill();
    // asteroids with simple shading
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // power‑ups
    powerUps.forEach(p => {
      ctx.fillStyle = p.type === 'shield' ? '#0f0' : '#ff0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // shield display
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Shield: ' + ship.shield, 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
