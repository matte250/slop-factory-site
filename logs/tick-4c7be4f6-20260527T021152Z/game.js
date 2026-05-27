// Simple top‑down spaceship game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5
    });
  }

  // Sounds
  const thrustSound = new Audio('https://freesound.org/data/previews/341/341695_5260875-lq.mp3');
  thrustSound.loop = true;
  const hitSound = new Audio('https://freesound.org/data/previews/341/341696_5260875-lq.mp3');
  const gameOverSound = new Audio('https://freesound.org/data/previews/341/341697_5260875-lq.mp3');

  // Player ship
  const ship = {
    thrust: false,
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 40,
    speed: 4,
    health: 3,
    color: '#0af',
    draw() {
      // ship body gradient
      const grad = ctx.createLinearGradient(this.x, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#004');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
      // thrust flame
      if (this.thrust) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.h / 2);
        ctx.lineTo(this.x - this.w / 4, this.y + this.h / 2 + 10);
        ctx.lineTo(this.x + this.w / 4, this.y + this.h / 2 + 10);
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frameCount = 0;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (width - size) + size / 2,
      y: -size,
      r: size / 2,
      speed: 2 + Math.random() * 2,
      // rotation properties
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      // color will be generated via gradient
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update() {
    // Ship thrust flag (used for flame)
    ship.thrust = keys['ArrowUp'];
    // Play/pause thrust sound
    if (ship.thrust) {
      if (thrustSound.paused) thrustSound.play();
    } else {
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // Keep inside bounds
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));
    ship.y = Math.max(ship.h / 2, Math.min(height - ship.h / 2, ship.y));

    // Update starfield (slow drift)
    stars.forEach(s => {
      s.y += 0.3;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    // Spawn asteroids
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
    frameCount++;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // Collision detection
    asteroids.forEach(a => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) {
        ship.health--;
        // Play hit sound
        hitSound.currentTime = 0;
        hitSound.play();
        // Remove collided asteroid
        a.y = height + a.r;
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw starfield
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship
    ship.draw();
    // Draw asteroids with rotation and shading
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      // radial gradient for rocky look
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.3, 0, 0, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Draw health
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + ship.health, 10, 20);
  }

  function loop() {
    if (ship.health <= 0) {
      // Stop thrust sound
      thrustSound.pause();
      thrustSound.currentTime = 0;
      // Play game over sound
      gameOverSound.play();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f55';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return; // stop loop
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
