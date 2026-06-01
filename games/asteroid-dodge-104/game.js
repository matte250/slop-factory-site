// Simple top-down asteroid dodge game
// Canvas with id "game" is expected in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Sound effects
  const crashSound = new Audio('data:audio/wav;base64,//uQxAAABAAEAAQAAF0F1ZGlvAQAAAAEAAAABAAACAAAKAAAQAABcH+AAABAAAABW1lZGlhAAAAAAgAAAAFAf//4Af//w=' ); // short beep
  crashSound.volume = 0.5;
  const bgMusic = new Audio('data:audio/wav;base64,//uQxAAABAAEAAQAAF0F1ZGlvAQAAAAEAAAABAAACAAAKAAAQAABcH+AAABAAAABW1lZGlhAAAAAAgAAAAFAf//4Af//w=' ); // placeholder loop
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  // Engine thrust sound
  const engineSound = new Audio('data:audio/wav;base64,//uQxAAABAAEAAQAAF0F1ZGlvAQAAAAEAAAABAAACAAAKAAAQAABcH+AAABAAAABW1lZGlhAAAAAAgAAAAFAf//4Af//w=' ); // placeholder
  engineSound.loop = true;
  engineSound.volume = 0.2;
  // Attempt to start background music (may require user interaction)
  bgMusic.play().catch(()=>{});
  const { width, height } = canvas;
  // Generate simple starfield for background
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // Ship definition
  const ship = {
    width: 30,
    height: 15,
    x: width / 2 - 15,
    y: height - 30,
    speed: 5,
    movingLeft: false,
    movingRight: false,
  };

  // Asteroid list
  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  const baseAsteroidSpeed = 2;

  // Game state
  let startTime = null;
  let elapsed = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') ship.movingLeft = true;
    if (e.code === 'ArrowRight') ship.movingRight = true;
    // Start engine sound on movement
    if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') && engineSound.paused) {
      engineSound.play().catch(() => {});
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') ship.movingLeft = false;
    if (e.code === 'ArrowRight') ship.movingRight = false;
    // Stop engine sound when no movement keys are pressed
    if (!ship.movingLeft && !ship.movingRight && !engineSound.paused) {
      engineSound.pause();
      engineSound.currentTime = 0;
    }
  });

  function spawnAsteroid() {
    const radius = 12 + Math.random() * 8;
    const x = Math.random() * (width - radius * 2) + radius;
    asteroids.push({ x, y: -radius, radius, speed: baseAsteroidSpeed + elapsed / 10000 });
  }

  // Update starfield positions
  const starSpeed = 0.2; // pixels per frame

  function update(dt) {
    // Move stars for background effect
    for (const s of stars) {
      s.y += starSpeed * dt;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // Move ship
    if (ship.movingLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (ship.movingRight) ship.x = Math.min(width - ship.width, ship.x + ship.speed);

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt;
      // Remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const withinX = a.x + a.radius > ship.x && a.x - a.radius < ship.x + ship.width;
      const withinY = a.y + a.radius > ship.y && a.y - a.radius < ship.y + ship.height;
        if (withinX && withinY) {
          crashSound.play();
          gameOver = true;
          bgMusic.pause();
          break;
        }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw moving stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (triangle pointing up) with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0f0';
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset after ship

    // Draw asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius*0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(elapsed / 1000)}` , 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Score: ${Math.floor(elapsed / 1000)}`, width / 2, height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - (lastFrameTime || timestamp)) / 16; // normalize to ~60fps units
    elapsed = timestamp - startTime;
    if (!gameOver) update(dt);
    draw();
    lastFrameTime = timestamp;
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrameTime = 0;
  requestAnimationFrame(loop);
})();
