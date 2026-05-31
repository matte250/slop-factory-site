// Simple asteroid dodge game targeting canvas#game
// Enhanced graphics: gradient background, star field, asteroid shading, ship outline
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Sound effects
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA');
  const moveSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA');
  // Ensure sounds can play without user gesture (some browsers require interaction)
  const enableAudio = () => { crashSound.play().catch(()=>{}); moveSound.play().catch(()=>{}); window.removeEventListener('click', enableAudio); };
  window.addEventListener('click', enableAudio);
  const width = canvas.width;
  const height = canvas.height;

  // Ship definition (triangle at bottom centre)
  const ship = {
    x: width / 2,
    y: height - 30,
    size: 20,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      // Ship body
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.size, this.y + this.size * 1.5);
      ctx.lineTo(this.x + this.size, this.y + this.size * 1.5);
      ctx.closePath();
      ctx.fill();
      // Outline for depth
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const asteroids = [];
  // Star field background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5
  }));
  let spawnTimer = 0;
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  const keyDown = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      ship.moveLeft = true;
      moveSound.currentTime = 0;
      moveSound.play();
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      ship.moveRight = true;
      moveSound.currentTime = 0;
      moveSound.play();
    }
  };
  const keyUp = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 5;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + score * 0.01; // speed increases with score
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function update(dt) {
    // Move ship
    if (ship.moveLeft) ship.x -= ship.speed;
    if (ship.moveRight) ship.x += ship.speed;
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x));

    // Spawn asteroids
    spawnTimer += dt;
    if (spawnTimer > 1000) { // every second
      spawnAsteroid();
      spawnTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.size) {
        gameOver = true;
        crashSound.currentTime = 0;
        crashSound.play();
        break;
      }
    }

    if (!gameOver) score += dt / 1000; // seconds
  }

  function draw() {
    // Gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    // Star field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship
    ship.draw();
    // Asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
