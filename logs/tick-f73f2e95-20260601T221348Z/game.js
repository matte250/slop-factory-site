// Nebula Escape – minimal canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // ----- Audio -----
  const thrustSound = new Audio('https://cdn.jsdelivr.net/gh/johnnyreilly/audio-assets/thrust.wav');
  const collisionSound = new Audio('https://cdn.jsdelivr.net/gh/johnnyreilly/audio-assets/collision.wav');
  const gameOverSound = new Audio('https://cdn.jsdelivr.net/gh/johnnyreilly/audio-assets/gameover.wav');
  // reduce volume
  thrustSound.volume = 0.2;
  collisionSound.volume = 0.3;
  gameOverSound.volume = 0.5;
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // ----- Visuals -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function drawBackground() {
    // dark space gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#00102a');
    grad.addColorStop(1, '#000814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ----- Game entities -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0, // radians
    radius: 10,
    speed: 0,
    thrust: 0.2,
    friction: 0.98,
    shield: 100,
  };

  const asteroids = [];
  const maxAsteroids = 30;

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 15 + Math.random() * 25;
    const speed = 0.5 + Math.random() * 1.0;
    // spawn at edges
    if (side === 0) { x = 0; y = Math.random() * canvas.height; vx = speed; vy = (Math.random() - 0.5) * speed; }
    else if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; vx = -speed; vy = (Math.random() - 0.5) * speed; }
    else if (side === 2) { x = Math.random() * canvas.width; y = 0; vx = (Math.random() - 0.5) * speed; vy = speed; }
    else { x = Math.random() * canvas.width; y = canvas.height; vx = (Math.random() - 0.5) * speed; vy = -speed; }
    const angle = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.02; // slow spin
    asteroids.push({ x, y, vx, vy, radius: size, angle, rotationSpeed });
  }

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  function updateShip() {
    // Rotation
    if (keys['arrowleft'] || keys['a']) ship.angle -= 0.05;
    if (keys['arrowright'] || keys['d']) ship.angle += 0.05;
    // Thrust
    if (keys['arrowup'] || keys['w']) {
      ship.speed += ship.thrust;
      // play thrust sound
      if (thrustSound.paused) {
        thrustSound.currentTime = 0;
        thrustSound.play();
      } else {
        thrustSound.currentTime = 0;
      }
    } else {
      // stop thrust sound when not accelerating
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }
    // Apply velocity
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    ship.speed *= ship.friction;
    // Wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;
  }

  function updateAsteroids() {
    // Move, rotate and recycle
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // update rotation
      if (a.rotationSpeed) a.angle += a.rotationSpeed;
      if (a.x < -a.radius) a.x = canvas.width + a.radius;
      if (a.x > canvas.width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = canvas.height + a.radius;
      if (a.y > canvas.height + a.radius) a.y = -a.radius;
    }
    // Remove old and spawn new
    while (asteroids.length > maxAsteroids) asteroids.shift();
    if (asteroids.length < maxAsteroids && Math.random() < 0.02) spawnAsteroid();
  }

  function checkCollisions() {
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        ship.shield -= 20;
        // play collision sound
        collisionSound.currentTime = 0;
        collisionSound.play();
        // bounce asteroid away
        a.vx *= -0.5; a.vy *= -0.5;
        if (ship.shield <= 0) {
          // Game over – stop loop
          cancelAnimationFrame(animId);
          // play game over sound
          gameOverSound.play();
          alert('Game Over!');
        }
      }
    }
  }

  function draw() {
    // Draw space background first
    drawBackground();
    // Ship – draw with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#00f9ff'; // cyan ship
    ctx.fill();
    // thrust flame when accelerating
    if (keys['arrowup'] || keys['w']) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.shadowColor = 'orange';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // Asteroids – draw with rotation and shading
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      // create radial gradient for depth
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(a.radius, 0);
      ctx.lineTo(a.radius * 0.6, a.radius * 0.8);
      ctx.lineTo(-a.radius * 0.6, a.radius * 0.8);
      ctx.lineTo(-a.radius, 0);
      ctx.lineTo(-a.radius * 0.6, -a.radius * 0.8);
      ctx.lineTo(a.radius * 0.6, -a.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Shield bar
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 100, 8);
    ctx.fillStyle = 'lime';
    ctx.fillRect(10, 10, ship.shield, 8);
  }

  let animId;
  function loop() {
    updateShip();
    updateAsteroids();
    checkCollisions();
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Start game
  loop();
})();
