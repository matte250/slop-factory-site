// Simple Asteroid Dodge game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Create background starfield
  const bgStars = [];
  for (let i = 0; i < 100; i++) {
    bgStars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5 + 0.5 });
  }
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function playTone(freq, length) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + length / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + length / 1000);
  }
  function startAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Ship
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 15,
    speed: 3,
    dx: 0,
    dy: 0,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.dy, this.dx) + Math.PI / 2);
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size / 2, this.size);
      ctx.lineTo(-this.size / 2, this.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      this.x = Math.max(0, Math.min(width, this.x + this.dx));
      this.y = Math.max(0, Math.min(height, this.y + this.dy));
    }
  };

  const keys = {};
  window.addEventListener('keydown', e => {
  startAudio();
  keys[e.key] = true;
});
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function handleInput() {
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
  }

  // Entities
  const asteroids = [];
  const stars = [];
  let lastAsteroid = 0;
  let lastStar = 0;
  let score = 0;
  let multiplier = 1;
  let gameOver = false;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 20 + Math.random() * 30;
    const speed = 1 + Math.random() * 2;
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -size;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (edge === 1) { // right
      x = width + size;
      y = Math.random() * height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + size;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
    } else { // left
      x = -size;
      y = Math.random() * height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
    }
    asteroids.push({ x, y, vx, vy, size, radius: size / 2 });
  }

  function spawnStar() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 8;
    const speed = 0.8;
    if (edge === 0) { x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * speed; vy = speed; }
    else if (edge === 1) { x = width + size; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; }
    else if (edge === 2) { x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * speed; vy = -speed; }
    else { x = -size; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; }
    stars.push({ x, y, vx, vy, size, radius: size / 2 });
  }

  function updateEntities(arr, dt) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const e = arr[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < -100 || e.x > width + 100 || e.y < -100 || e.y > height + 100) {
        arr.splice(i, 1);
      }
    }
  }

  function checkCollisions() {
    // Ship vs asteroids
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.size / 2) {
        // collision sound
        playTone(150, 300);
        gameOver = true;
        return;
      }
    }
    // Ship vs stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = ship.x - s.x;
      const dy = ship.y - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < s.radius + ship.size / 2) {
        multiplier = Math.min(multiplier + 0.5, 5);
        stars.splice(i, 1);
        // star collect sound
        playTone(600, 150);
      }
    }
  }

  function drawBackground() {
    // twinkling background stars
    ctx.fillStyle = '#fff';
    for (const b of bgStars) {
      // slight flicker
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background
    drawBackground();
    // asteroids with gradient and rotation
    for (const a of asteroids) {
      const angle = Math.atan2(a.vy, a.vx);
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(angle);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // stars (collectibles) with glow
    for (const s of stars) {
      const grad = ctx.createRadialGradient(s.x, s.y, s.radius * 0.2, s.x, s.y, s.radius);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#880');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.atan2(ship.dy, ship.dx) + Math.PI / 2);
    const shipGrad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`x${multiplier.toFixed(1)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 16; // approx 60fps base
    lastTime = timestamp;
    if (!gameOver) {
      handleInput();
      ship.update();
      updateEntities(asteroids, dt);
      updateEntities(stars, dt);
      // spawn asteroids roughly every 1.5 seconds
      if (timestamp - lastAsteroid > 1500) { spawnAsteroid(); lastAsteroid = timestamp; }
      // spawn stars roughly every 5 seconds
      if (timestamp - lastStar > 5000) { spawnStar(); lastStar = timestamp; }
      checkCollisions();
      score += dt * multiplier;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
