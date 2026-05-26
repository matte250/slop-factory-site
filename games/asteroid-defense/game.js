// Asteroid Defense Game
// Canvas with id "game" is assumed to exist in the HTML.
// Enhanced graphics: background stars, gradient ship, glowing bullets/asteroids, styled health bar.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const center = { x: canvas.width / 2, y: canvas.height / 2 };

  // Pre-generate background stars for a parallax effect
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.3 + 0.1,
  }));

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship definition
  const ship = {
    x: center.x,
    y: center.y,
    radius: 12,
    angle: 0,
    health: 100,
  };

  // Store active asteroids and bullets
  const asteroids = [];
  const bullets = [];

  // Utility functions
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Mouse handling for rotation and shooting
  let mousePos = { x: ship.x, y: ship.y };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
    ship.angle = Math.atan2(mousePos.y - ship.y, mousePos.x - ship.x);
  });
  canvas.addEventListener('click', () => {
    // Fire bullet from ship tip
    const speed = 5;
    const vx = Math.cos(ship.angle) * speed;
    const vy = Math.sin(ship.angle) * speed;
    bullets.push({ x: ship.x, y: ship.y, vx, vy, radius: 3, ttl: 100 });
    // Play shooting sound
    beep(440, 0.05);
  });

  // Spawn asteroids
  function spawnAsteroid() {
    const edge = Math.floor(rand(0, 4)); // 0: top,1:right,2:bottom,3:left
    let x, y;
    if (edge === 0) { x = rand(0, canvas.width); y = -20; }
    else if (edge === 1) { x = canvas.width + 20; y = rand(0, canvas.height); }
    else if (edge === 2) { x = rand(0, canvas.width); y = canvas.height + 20; }
    else { x = -20; y = rand(0, canvas.height); }
    const angle = Math.atan2(center.y - y, center.x - x);
    const speed = rand(0.5, 2);
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: rand(10, 30) });
  }
  setInterval(spawnAsteroid, 1500);

  function update() {
  // Move background stars for subtle parallax
  stars.forEach(star => {
    star.x += star.speed;
    star.y += star.speed;
    if (star.x > canvas.width) star.x = 0;
    if (star.y > canvas.height) star.y = 0;
  });
    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.ttl--;
      if (b.ttl <= 0 || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    }
    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Collision with ship
      if (distance(a, ship) < a.radius + ship.radius) {
        ship.health -= 20;
        asteroids.splice(i, 1);
        // Play hit sound
        beep(220, 0.2);
        if (ship.health <= 0) {
          // Game over sound
          beep(110, 0.5);
          alert('Game Over');
          window.location.reload();
        }
        continue;
      }
      // Collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (distance(a, b) < a.radius + b.radius) {
          // Play asteroid destroy sound
          beep(660, 0.07);
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          break;
        }
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship gradient (metallic look)
    const grad = ctx.createLinearGradient(-12, -8, 12, 8);
    grad.addColorStop(0, '#4a90e2');
    grad.addColorStop(1, '#001f3f');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,255,255,0.7)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    // Dark background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars (parallax background)
    ctx.fillStyle = 'white';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship
    drawShip();

    // Draw bullets with glow
    bullets.forEach(b => {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 3);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,255,0,0.7)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw health bar with gradient background
    const barX = 10, barY = 10, barWidth = 200, barHeight = 12;
    // background
    ctx.fillStyle = '#444';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // health fill
    const healthGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    healthGrad.addColorStop(0, '#ff4d4d');
    healthGrad.addColorStop(1, '#ff1a1a');
    ctx.fillStyle = healthGrad;
    ctx.fillRect(barX, barY, (ship.health / 100) * barWidth, barHeight);
    // border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
