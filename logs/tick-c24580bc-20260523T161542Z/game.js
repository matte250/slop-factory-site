// Astro Dash – enhanced graphics version
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety if not present
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // ------- Audio setup -------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playBoost = () => playTone(300, 0.08);
  const playCollect = () => playTone(600, 0.12);
  const playExplosion = () => playTone(150, 0.4);


  // ------- Game state -------
  const ship = {
    x: width / 2,
    y: height * 0.85,
    radius: 12,
    speed: 2, // base forward speed (asteroid scroll speed)
    fuel: 100,
    shield: 0, // frames remaining
  };
  const keys = { left: false, right: false, boost: false };
  const asteroids = [];
  const orbs = [];
  const stars = [];
  let frame = 0;
  let gameOver = false;

  // ------- Input handling -------
  window.addEventListener('keydown', e => {
    resumeAudio();
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === ' ') keys.boost = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === ' ') keys.boost = false;
  });
  // mouse steering (optional)
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  // ------- Helpers -------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const circleCollide = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = a.radius + b.radius;
    return dx * dx + dy * dy < r * r;
  };

  // ------- Spawn logic -------
  const spawnAsteroid = () => {
    const size = rand(10, 30);
    asteroids.push({ x: rand(size, width - size), y: -size, radius: size, speed: ship.speed + rand(0.5, 1.5) });
  };
  const spawnOrb = () => {
    const rad = 8;
    orbs.push({ x: rand(rad, width - rad), y: -rad, radius: rad, speed: ship.speed });
  };
  // stars: tiny background points
  const spawnStar = () => {
    const size = rand(0.5, 1.5);
    const speed = ship.speed * 0.5 + rand(0.1, 0.3);
    stars.push({ x: rand(0, width), y: -size, radius: size, speed });
  };

  // ------- Game loop -------
  const update = () => {
    if (gameOver) return;
    frame++;

    // increase difficulty over time
    if (frame % 80 === 0) spawnAsteroid();
    if (frame % 300 === 0) spawnOrb();
    // background stars
    if (frame % 5 === 0) spawnStar();

    // ship movement
    const moveX = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
    ship.x += moveX * 4;
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    // boost speed consumes fuel
    const boostFactor = keys.boost && ship.fuel > 0 ? 2 : 1;
    const currentSpeed = ship.speed * boostFactor;
    if (keys.boost && ship.fuel > 0) {
      ship.fuel = Math.max(0, ship.fuel - 0.3);
      playBoost();
    }
    // fuel drain over time
    ship.fuel = Math.max(0, ship.fuel - 0.02);
    // shield timer decay
    if (ship.shield > 0) ship.shield--;

    // move obstacles/orbs downwards
    const moveObjs = arr => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const o = arr[i];
        o.y += o.speed * boostFactor;
        if (o.y - o.radius > height) arr.splice(i, 1);
      }
    };
    moveObjs(asteroids);
    moveObjs(orbs);
    moveObjs(stars);

    // collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
        if (circleCollide(ship, a)) {
          if (ship.shield > 0) {
            ship.shield = 0;
            asteroids.splice(i, 1);
          } else {
            gameOver = true;
            playExplosion();
          }
        }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
        if (circleCollide(ship, o)) {
          ship.fuel = Math.min(100, ship.fuel + 20);
          ship.shield = 180; // 3 seconds shield
          orbs.splice(i, 1);
          playCollect();
        }
    }
    if (ship.fuel <= 0) gameOver = true;

    draw();
    if (!gameOver) requestAnimationFrame(update);
    else drawGameOver();
  };

  // ------- Rendering -------
  const draw = () => {
    // Background: dark space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars – tiny white points
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship – triangle with optional flame for boost
    ctx.fillStyle = ship.shield > 0 ? 'gold' : 'white';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    if (keys.boost && ship.fuel > 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.radius);
      ctx.lineTo(ship.x - ship.radius / 2, ship.y + ship.radius + 8);
      ctx.lineTo(ship.x + ship.radius / 2, ship.y + ship.radius + 8);
      ctx.closePath();
      ctx.fill();
    }

    // Asteroids – gray circles with subtle stroke
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#555';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Energy orbs – cyan with radial glow
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      orbGrad.addColorStop(0, '#0ff');
      orbGrad.addColorStop(1, '#004');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD – fuel bar on top left with border
    ctx.fillStyle = 'lime';
    const barWidth = 100;
    ctx.fillRect(10, 10, (ship.fuel / 100) * barWidth, 8);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, barWidth, 8);
  };

  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  };

  // start loop
  update();
})();
