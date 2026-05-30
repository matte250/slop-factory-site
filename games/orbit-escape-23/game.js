// Simple Orbit Escape game
// Targets canvas with id="game"
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);
  // generate background stars
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
  }));

  // planet at centre
  const planet = { x: width / 2, y: height / 2, r: 30 };

  // ship state
  const ship = {
    angle: 0, // radians around planet centre
    radius: 120, // distance from centre
    size: 10,
    speed: 0.015, // angular speed per frame
    thrust: 0,
    maxThrust: 2,
    thrustAccel: 0.05,
  };

  // asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 120; // frames
  let frameCount = 0;

  function spawnAsteroid() {
    // spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    switch (side) {
      case 0: // top
        x = Math.random() * width; y = -20; vx = (Math.random() - 0.5) * speed; vy = speed; break;
      case 1: // right
        x = width + 20; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * width; y = height + 20; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
      case 3: // left
        x = -20; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
    }
    const r = 8 + Math.random() * 12;
    asteroids.push({ x, y, vx, vy, r });
  }

  function update() {
    // ship controls – simple thrust with arrow up/down
    if (keys['ArrowUp']) {
      ship.thrust = Math.min(ship.maxThrust, ship.thrust + ship.thrustAccel);
      // play thrust sound
      playTone(440, 0.1);
    } else if (keys['ArrowDown']) {
      ship.thrust = Math.max(0, ship.thrust - ship.thrustAccel);
    } else {
      // gradual decay
      ship.thrust *= 0.98;
    }
    // change radius based on thrust (radial movement)
    ship.radius += ship.thrust * 0.5;
    if (ship.radius < planet.r + ship.size) ship.radius = planet.r + ship.size;
    if (ship.radius > Math.min(width, height) / 2 - ship.size) ship.radius = Math.min(width, height) / 2 - ship.size;

    ship.angle += ship.speed;

    // update asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
    });
    // remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -30 || a.x > width + 30 || a.y < -30 || a.y > height + 30) asteroids.splice(i, 1);
    }

    if (frameCount++ % asteroidSpawnInterval === 0) spawnAsteroid();
  }

  function draw() {
    // clear with dark space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // planet
    ctx.fillStyle = '#2b5dff';
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();

    // ship position
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - Math.cos(ship.angle) * ship.size - Math.sin(ship.angle) * ship.size / 2,
               sy - Math.sin(ship.angle) * ship.size + Math.cos(ship.angle) * ship.size / 2);
    ctx.lineTo(sx - Math.cos(ship.angle) * ship.size + Math.sin(ship.angle) * ship.size / 2,
               sy - Math.sin(ship.angle) * ship.size - Math.cos(ship.angle) * ship.size / 2);
    ctx.closePath();
    ctx.fill();

    // asteroids
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function loop() {
    update();
    draw();
    // collision detection
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    for (const a of asteroids) {
      const dx = a.x - sx;
      const dy = a.y - sy;
      if (Math.hypot(dx, dy) < a.r + ship.size) {
        // collision sound
        playTone(200, 0.3);
        // game over – stop animation
        alert('Game Over');
        return;
      }
    }
    requestAnimationFrame(loop);
  }

  // start after a short delay to ensure canvas size is known
  setTimeout(loop, 100);
})();
