// Enhanced Canvas Asteroid Escape game with improved graphics
// Canvas element with id="game" must exist in the HTML.

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);
  // generate a simple starfield background
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrustSound() { playTone(300, 0.1, 'square'); }
  function playPickupSound() { playTone(800, 0.15, 'triangle'); }
  function playExplosionSound() { playTone(120, 0.5, 'sawtooth'); }


  // ----- Game data -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    radius: 12,
    speedX: 0,
    speedY: 0,
  };
  const asteroids = []; // each asteroid will have {x,y,vx,vy,r,angle,angularSpeed}
  const fuels = [];
  let fuel = 100; // starts full, drains over time
  let distance = 0; // score
  let lastTime = 0;
  let gameOver = false;

  // ----- Helper functions -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() { // create asteroid with rotation
    const size = rand(15, 40);
    const edge = Math.floor(rand(0, 4)); // 0: top, 1: right, 2: bottom, 3: left
    let x, y, vx, vy;
    const speed = rand(0.5, 2.5);
    if (edge === 0) {
      x = rand(0, width);
      y = -size;
      vx = rand(-1, 1) * speed;
      vy = speed;
    } else if (edge === 1) {
      x = width + size;
      y = rand(0, height);
      vx = -speed;
      vy = rand(-1, 1) * speed;
    } else if (edge === 2) {
      x = rand(0, width);
      y = height + size;
      vx = rand(-1, 1) * speed;
      vy = -speed;
    } else {
      x = -size;
      y = rand(0, height);
      vx = speed;
      vy = rand(-1, 1) * speed;
    }
    asteroids.push({ x, y, vx, vy, r: size, angle: Math.random()*Math.PI*2, angularSpeed: (Math.random()-0.5)*0.02 });
  }

  function spawnFuel() {
    const size = 8;
    const x = rand(size, width - size);
    const y = rand(size, height - size);
    fuels.push({ x, y, r: size });
  }

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', (e) => (keys[e.code] = false));

  function update(dt) { // update asteroid rotation and starfield parallax // update asteroid rotation and starfield parallax
    if (gameOver) return;
    // steering
    if (keys['ArrowLeft']) ship.angle -= 3 * dt; // rotate left
    if (keys['ArrowRight']) ship.angle += 3 * dt; // rotate right
    // thrust with space
    if (keys['Space']) {
      const thrust = 0.1;
      ship.speedX += Math.cos(ship.angle) * thrust;
      ship.speedY += Math.sin(ship.angle) * thrust;
      playThrustSound();
    }
    // apply friction
    ship.speedX *= 0.99;
    ship.speedY *= 0.99;
    // move ship
    ship.x += ship.speedX;
    ship.y += ship.speedY;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // fuel consumption
    fuel -= dt * 5; // base drain
    if (keys['Space']) fuel -= dt * 10; // extra when thrusting
    if (fuel <= 0) {
      fuel = 0;
      gameOver = true;
    }

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.angularSpeed; // rotate asteroid
      // remove off‑screen
      if (a.x < -a.r || a.x > width + a.r || a.y < -a.r || a.y > height + a.r) {
        asteroids.splice(i, 1);
      }
    }

    // collision ship ↔ asteroid
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.r + ship.radius) {
          playExplosionSound();
          gameOver = true;
          break;
        }
    }

    // fuel pickups
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = ship.x - f.x;
      const dy = ship.y - f.y;
      const dist = Math.hypot(dx, dy);
if (dist < f.r + ship.radius) {
          fuel = Math.min(fuel + 30, 100);
          fuels.splice(i, 1);
          playPickupSound();
        }
    }

    // spawn logic
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // score
    distance += dt * 10;
  }

  // Draw background and game objects
function draw() { // render starfield, ship, asteroids, fuel
    // draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    // asteroids
    ctx.fillStyle = '#a55';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // fuel pickups
    ctx.fillStyle = '#5a5';
    for (const f of fuels) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + fuel.toFixed(0), 10, 20);
    ctx.fillText('Score: ' + Math.floor(distance), 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000 || 0;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
