// Simple Orbit Dodge game with enhanced graphics
// Canvas expects <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;

  // ----- Starfield background (generated once) -----
  const stars = [];
  const starCount = 150;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }

  // player ship
  const ship = {
    angle: 0,          // radians around planet
    radius: 80,         // distance from planet center
    speed: 0.03,        // angular speed per frame
    thrust: 0,         // outward speed
    maxThrust: 3,
    size: 12,
    color: '#0ff'
  };

  const planet = { x: w/2, y: h/2, radius: 30, color: '#071' };

  // asteroids
  const asteroids = [];
  const asteroidSpawnRate = 0.02; // per frame
  const maxAsteroids = 30;

  // input handling and sound setup
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let thrustOsc = null;

  function startThrustSound() {
    if (thrustOsc) return; // already playing
    thrustOsc = audioCtx.createOscillator();
    thrustOsc.type = 'sawtooth';
    thrustOsc.frequency.setValueAtTime(440, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCrashSound() {
    const duration = 0.3;
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      if (!keys[e.key]) {
        // edge detection
        if (e.key === 'ArrowUp') startThrustSound();
      }
      keys[e.key] = true;
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) {
      keys[e.key] = false;
      if (e.key === 'ArrowUp') stopThrustSound();
    }
  });

  function spawnAsteroid() {
    // spawn at random angle, random distance outside view
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(w, h);
    const speed = 1 + Math.random() * 2;
    const radius = 8 + Math.random() * 8;
    const hue = Math.floor(Math.random() * 30 + 330); // reddish tones
    asteroids.push({ angle, dist, speed, radius, hue });
  }

  function update() {
    // player controls
    if (keys.ArrowLeft) ship.angle -= ship.speed;
    if (keys.ArrowRight) ship.angle += ship.speed;
    if (keys.ArrowUp) ship.thrust = Math.min(ship.thrust + 0.1, ship.maxThrust);
    else ship.thrust = Math.max(ship.thrust - 0.05, 0);
    ship.radius += ship.thrust;

    // keep ship within bounds (lose condition)
    if (ship.radius > Math.max(w, h) || ship.radius < planet.radius + 5) {
      cancelAnimationFrame(rAF);
      playCrashSound();
      alert('Game Over');
      return;
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.dist -= a.speed; // move toward center
      if (a.dist < 0) asteroids.splice(i, 1);
    }
    // spawn new asteroids
    if (asteroids.length < maxAsteroids && Math.random() < asteroidSpawnRate) spawnAsteroid();

    // collision detection
    const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
    const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
    for (const a of asteroids) {
      const ax = planet.x + Math.cos(a.angle) * a.dist;
      const ay = planet.y + Math.sin(a.angle) * a.dist;
      const dx = shipX - ax;
      const dy = shipY - ay;
      const distSq = dx * dx + dy * dy;
      const radSum = ship.size + a.radius;
      if (distSq < radSum * radSum) {
        cancelAnimationFrame(rAF);
        playCrashSound();
        alert('Game Over');
        return;
      }
    }
  }

  function draw() {
    // ----- Background -----
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // stars
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x, planet.y, planet.radius * 0.2,
      planet.x, planet.y, planet.radius
    );
    planetGrad.addColorStop(0, '#3f7');
    planetGrad.addColorStop(1, '#071');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    // ship with simple shadow for depth
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,255,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - Math.cos(ship.angle) * ship.size, sy - Math.sin(ship.angle) * ship.size);
    ctx.lineTo(sx + Math.sin(ship.angle) * ship.size, sy - Math.cos(ship.angle) * ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids with subtle color variation
    for (const a of asteroids) {
      const ax = planet.x + Math.cos(a.angle) * a.dist;
      const ay = planet.y + Math.sin(a.angle) * a.dist;
      ctx.fillStyle = `hsl(${a.hue}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(ax, ay, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    update();
    draw();
    rAF = requestAnimationFrame(loop);
  }
  let rAF = requestAnimationFrame(loop);
})();
