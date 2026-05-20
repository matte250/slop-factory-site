// Simple Asteroid Miner game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 600;

  // Sound assets (using simple public domain sounds)
  const thrustAudio = new Audio('https://freesound.org/data/previews/341/341695_6244725-lq.mp3'); // short thrust
  thrustAudio.loop = true;
  const mineAudio = new Audio('https://freesound.org/data/previews/331/331912_3248244-lq.mp3'); // mining beep
  const crashAudio = new Audio('https://freesound.org/data/previews/353/353539_4017125-lq.mp3'); // crash
  const bgMusic = new Audio('https://freesound.org/data/previews/331/331912_3248244-lq.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play();

  // Ship
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    r: 12,
    angle: 0,
    speed: 0,
    maxSpeed: 4,
    accel: 0.1,
    turnSpeed: 0.07,
    fuel: 1000,
    score: 0,
    alive: true,
  };

  // Asteroids pool
  const asteroids = [];
  const AST_COUNT = 30;
  for (let i = 0; i < AST_COUNT; i++) {
    asteroids.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: 15 + Math.random() * 20,
      vx: -1 + Math.random() * 2,
      vy: -1 + Math.random() * 2,
    });
  }

  // Pre‑generated starfield
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      c: 'rgba(255,255,255,' + (0.5 + Math.random() * 0.5) + ')',
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function update() {
    if (!ship.alive) return;
    // Controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp']) ship.speed = Math.min(ship.speed + ship.accel, ship.maxSpeed);
    else ship.speed = Math.max(ship.speed - ship.accel * 0.5, 0);

    // Thrust sound handling
    if (keys['ArrowUp'] && ship.alive) {
      if (thrustAudio.paused) thrustAudio.play();
    } else {
      thrustAudio.pause();
      thrustAudio.currentTime = 0;
    }

    // Move ship
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    ship.fuel--;
    if (ship.fuel <= 0) ship.alive = false;

    // Wrap around edges
    if (ship.x < 0) ship.x += WIDTH;
    if (ship.x > WIDTH) ship.x -= WIDTH;
    if (ship.y < 0) ship.y += HEIGHT;
    if (ship.y > HEIGHT) ship.y -= HEIGHT;

    // Update asteroids and check collisions
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += WIDTH;
      if (a.x > WIDTH) a.x -= WIDTH;
      if (a.y < 0) a.y += HEIGHT;
      if (a.y > HEIGHT) a.y -= HEIGHT;

      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        // Collision: if speed low, mine; else crash
        if (ship.speed < 1) {
          ship.score += Math.floor(a.r);
          // play mining sound
          mineAudio.currentTime = 0;
          mineAudio.play();
          // respawn asteroid
          a.x = Math.random() * WIDTH;
          a.y = Math.random() * HEIGHT;
          a.r = 15 + Math.random() * 20;
          a.vx = -1 + Math.random() * 2;
          a.vy = -1 + Math.random() * 2;
        } else {
          ship.alive = false;
          // play crash sound
          crashAudio.currentTime = 0;
          crashAudio.play();
        }
      }
    }
  }

function draw() {
    // Background gradient (space nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Starfield background (pre‑generated stars)
    for (const star of stars) {
      ctx.fillStyle = star.c;
      ctx.fillRect(star.x, star.y, 1, 1);
    }

    // Asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with thruster effect
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Thruster flame when accelerating
    if (keys['ArrowUp'] && ship.alive) {
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 8, -5);
      ctx.lineTo(-ship.r - 8, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fillStyle = ship.alive ? '#0f0' : '#f00';
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${ship.score}`, 10, 20);
    ctx.fillText(`Fuel: ${ship.fuel}`, 10, 40);
    if (!ship.alive) ctx.fillText('Game Over', WIDTH / 2 - 40, HEIGHT / 2);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
