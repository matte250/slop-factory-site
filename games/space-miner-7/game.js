// Space Miner – simple canvas game
// Canvas with id="game" must exist in the page.
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playLaser() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  function startThrust() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = osc;
  }
  function stopThrust() {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playExplosion(x) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const pan = audioCtx.createStereoPanner();
    // pan based on horizontal position (-1 to 1)
    pan.pan.value = ((x / width) * 2) - 1;
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(pan).connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  function playGameOver() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  }

  // ----- Starfield background -----
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.5 + Math.random() * 1.5,
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  // ----- Background gradient -----
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001527'); // dark space near top
  bgGradient.addColorStop(1, '#000'); // black bottom

  // ----- Game state -----
  const ship = {
    x: width / 2,
    y: height * 0.8,
    angle: -Math.PI / 2, // facing up
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: false,
    turnLeft: false,
    turnRight: false,
    laserCooldown: 0,
  };
  const lasers = [];
  const asteroids = [];
  let score = 0;
  let hull = 3;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', (e) => {
    // resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    e.preventDefault();
  });

  // ----- Helper functions -----
  function spawnAsteroid() {
    const side = Math.random() < 0.5 ? 'top' : 'left';
    const size = 15 + Math.random() * 25;
    const speed = 0.5 + Math.random() * 1.5;
    const asteroid = {
      x: side === 'top' ? Math.random() * width : -size,
      y: side === 'top' ? -size : Math.random() * height,
      vx: side === 'top' ? speed * (Math.random() - 0.5) : speed,
      vy: side === 'top' ? speed : speed * (Math.random() - 0.5),
      radius: size,
    };
    asteroids.push(asteroid);
  }

  function updateShip(dt) {
    const turnSpeed = 3; // radians per second
    const thrustPower = 200; // px/s^2
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= turnSpeed * dt;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += turnSpeed * dt;
    if (keys['ArrowUp'] || keys['KeyW']) {
      ship.vx += Math.cos(ship.angle) * thrustPower * dt;
      ship.vy += Math.sin(ship.angle) * thrustPower * dt;
      ship.thrust = true;
      startThrust();
    } else {
      ship.thrust = false;
      stopThrust();
    }
    // friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // laser fire
    if ((keys['Space'] || keys['KeyZ']) && ship.laserCooldown <= 0) {
      const speed = 400;
      lasers.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(ship.angle) * speed,
        vy: Math.sin(ship.angle) * speed,
        ttl: 0.5,
      });
      ship.laserCooldown = 0.3; // seconds
      playLaser();
    }
    ship.laserCooldown = Math.max(0, ship.laserCooldown - dt);
  }

  function updateLasers(dt) {
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.ttl -= dt;
      if (l.ttl <= 0 || l.x < 0 || l.x > width || l.y < 0 || l.y > height) {
        lasers.splice(i, 1);
      }
    }
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // remove off‑screen
      if (a.x < -a.radius || a.x > width + a.radius || a.y < -a.radius || a.y > height + a.radius) {
        asteroids.splice(i, 1);
        continue;
      }
      // ship collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        hull -= 1;
        asteroids.splice(i, 1);
        playExplosion(a.x);
        if (hull <= 0) {
          gameOver = true;
          playGameOver();
        }
        continue;
      }
      // laser collision
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        const lx = l.x - a.x;
        const ly = l.y - a.y;
        if (Math.hypot(lx, ly) < a.radius) {
          score += 10;
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          playExplosion(a.x);
          break;
        }
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // glow effect
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 8;
    // ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    // thrust flame
    if (ship.thrust) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLasers() {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,0,0,0.7)';
    ctx.shadowBlur = 4;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - l.vx * 0.02, l.y - l.vy * 0.02);
      ctx.stroke();
    });
    // reset shadow for other draws
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Hull: ' + hull, 10, 40);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
  }

  // ----- Star drawing -----
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      // simple twinkle by modulating radius
      const radius = s.radius + Math.sin(s.twinkle + performance.now() / 500) * 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.2, radius), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----- Main loop -----
  let lastTime = performance.now();
  let asteroidTimer = 0;
  function loop(now) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    if (!gameOver) {
      // spawn asteroids roughly every 1.5 s
      asteroidTimer += dt;
      if (asteroidTimer > 1.5) {
        spawnAsteroid();
        asteroidTimer = 0;
      }
      updateShip(dt);
      updateLasers(dt);
      updateAsteroids(dt);
    }
    // render
    ctx.clearRect(0, 0, width, height);
    drawStars();
    drawShip();
    drawLasers();
    drawAsteroids();
    drawHUD();
    if (gameOver) drawGameOver();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
