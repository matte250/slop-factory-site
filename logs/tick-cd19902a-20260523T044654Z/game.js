// Simple Asteroid Dodge game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game settings
  const shipSize = 20;
  const shipSpeed = 4;
  const asteroidSize = 30;
  const asteroidSpeed = 2;
  const orbSize = 10;
  const totalOrbs = 5;
  const gameDuration = 30; // seconds

  let keys = {};
  let ship = { x: width / 2, y: height - shipSize * 2, radius: shipSize / 2 };
  let asteroids = [];
  let orbs = [];
  let startTime = null;
  let gameOver = false;
  let collected = 0;
  // sounds
  const collectSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const winSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  let endSoundPlayed = false;

  // Input handling
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  function spawnAsteroid() {
    const x = Math.random() * (width - asteroidSize) + asteroidSize / 2;
    asteroids.push({ x, y: -asteroidSize, radius: asteroidSize / 2 });
  }

  function spawnOrbs() {
    while (orbs.length < totalOrbs) {
      const x = Math.random() * (width - orbSize) + orbSize / 2;
      const y = Math.random() * (height - orbSize) + orbSize / 2;
      // avoid spawning on top of ship
      if (Math.hypot(x - ship.x, y - ship.y) > shipSize * 2) {
        orbs.push({ x, y, radius: orbSize / 2, collected: false });
      }
    }
  }

  function update() {
    // move ship
    if (keys.ArrowLeft && ship.x - shipSize > 0) ship.x -= shipSpeed;
    if (keys.ArrowRight && ship.x + shipSize < width) ship.x += shipSpeed;
    if (keys.ArrowUp && ship.y - shipSize > 0) ship.y -= shipSpeed;
    if (keys.ArrowDown && ship.y + shipSize < height) ship.y += shipSpeed;

    // update asteroids
    asteroids.forEach(a => a.y += asteroidSpeed);
    // remove off‑screen asteroids
    asteroids = asteroids.filter(a => a.y - a.radius < height);

    // spawn new asteroids periodically
    if (Math.random() < 0.02) spawnAsteroid();

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (dist(a, ship) < a.radius + ship.radius) {
        gameOver = true;
        crashSound.play();
        break;
      }
    }

    // orb collection
    orbs.forEach(o => {
      if (!o.collected && dist(o, ship) < o.radius + ship.radius) {
        o.collected = true;
        collected++;
        collectSound.play();
      }
    });

    // win condition
    const elapsed = (Date.now() - startTime) / 1000;
    if (collected === totalOrbs || elapsed >= gameDuration) {
      gameOver = true;
    }
  }

  function draw() {
    // background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // ship (triangle pointing up)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // asteroids
    ctx.fillStyle = '#f33';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // orbs
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => {
      if (!o.collected) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // UI text
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    ctx.fillText(`Orbs: ${collected}/${totalOrbs}`, 10, 38);
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      // play ending sound once
      if (!endSoundPlayed) {
        if (collected === totalOrbs) {
          winSound.play();
        } else if (!crashSound.paused) {
          // crash sound already played on collision
        } else {
          // generic lose sound (reuse crash)
          crashSound.play();
        }
        endSoundPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      const msg = collected === totalOrbs ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, width / 2 - ctx.measureText(msg).width / 2, height / 2);
    }
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // init
  spawnOrbs();
  startTime = Date.now();
  requestAnimationFrame(loop);
})();
