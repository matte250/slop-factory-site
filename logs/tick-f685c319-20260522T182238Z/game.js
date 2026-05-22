// Asteroid Rescue – minimal implementation
// Canvas with id="game" must exist in the page

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // Sounds
  const crashSound = new Audio('https://www.soundjay.com/explosion/explosion-01.mp3');
  const collectSound = new Audio('https://www.soundjay.com/button/sounds/button-09.mp3');
  const bgMusic = new Audio('https://www.soundjay.com/ambient/sounds/space-ambient-1.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;

  // Game state
  let points = 0;
  let fuel = 100; // percent
  const ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 3 };
  const keys = {};
  const asteroids = [];
  const astronauts = [];

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectIntersect = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Input
  let musicStarted = false;
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!musicStarted) {
      bgMusic.play();
      musicStarted = true;
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Spawn functions
  const spawnAsteroid = () => {
    const size = rand(20, 50);
    asteroids.push({
      x: rand(0, width - size),
      y: -size,
      w: size,
      h: size,
      speed: rand(1, 3)
    });
  };

  const spawnAstronaut = () => {
    const size = 20;
    astronauts.push({
      x: rand(0, width - size),
      y: -size,
      w: size,
      h: size,
      speed: rand(1, 2)
    });
  };

  // Main loop
  let frame = 0;
  const update = () => {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Fuel drain
    if (frame % 60 === 0) fuel = Math.max(0, fuel - 0.2);

    // Spawn entities
    if (frame % 90 === 0) spawnAsteroid();
    if (frame % 300 === 0) spawnAstronaut();

    // Update stars for parallax effect
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship → lose
      if (rectIntersect(ship, a)) {
        crashSound.play();
        endGame();
        return;
      }
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Update astronauts
    for (let i = astronauts.length - 1; i >= 0; i--) {
      const a = astronauts[i];
      a.y += a.speed;
      if (rectIntersect(ship, a)) {
        points += 10;
        collectSound.currentTime = 0;
        collectSound.play();
        astronauts.splice(i, 1);
        continue;
      }
      if (a.y > height) astronauts.splice(i, 1);
    }

    // Lose if no fuel
    if (fuel <= 0) {
      crashSound.play();
      endGame();
      return;
    }

    draw();
    frame++;
    requestAnimationFrame(update);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Background stars (parallax)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship – simple triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids – gray circles with slight shading
    ctx.fillStyle = '#666';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Astronauts – green squares with border
    astronauts.forEach(a => {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.strokeStyle = '#070';
      ctx.strokeRect(a.x, a.y, a.w, a.h);
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Points: ${points}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(1)}%`, 10, 40);
  };

  const endGame = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
    ctx.fillText(`Score: ${points}`, width / 2, height / 2 + 40);
  };

  // Start the loop
  requestAnimationFrame(update);
})();
