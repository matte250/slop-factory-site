// Minimal endless dodge runner based on IDEA.md
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Create a simple starfield background
  const stars = [];
  const starCount = Math.floor((canvas.width * canvas.height) / 8000);
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const ship = {
    x: canvas.width * 0.1,
    y: canvas.height / 2,
    radius: 15,
    speed: 4,
    dx: 0,
    dy: 0,
  };

  const keys = {};
  // Ensure audio context is resumed on first user interaction
  let audioStarted = false;
  function ensureAudio(){
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }
  // Simple tone generator
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    ensureAudio();
    // Play a subtle engine beep when moving
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      playTone(300, 0.05);
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  class Asteroid {
    constructor() {
      this.radius = 10 + Math.random() * 20;
      this.x = canvas.width + this.radius;
      this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
      this.speed = 2 + Math.random() * 2 + gameState.speedIncrease;
    }
    update() {
      this.x -= this.speed;
    }
    draw() {
      // Draw asteroid with radial gradient for a 3D feel
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.radius * 0.2,
        this.x, this.y, this.radius
      );
      gradient.addColorStop(0, '#bbb');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    isOffScreen() {
      return this.x + this.radius < 0;
    }
  }

  const asteroids = [];
  let lastSpawn = 0;
  const gameState = {
    startTime: performance.now(),
    lastTime: performance.now(),
    score: 0,
    spawnInterval: 1500, // ms
    speedIncrease: 0,
    gameOver: false,
  };

  function updateShip() {
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
    ship.x += ship.dx;
    ship.y += ship.dy;
  }

  function checkCollisions() {
    // ship vs asteroids
    for (const a of asteroids) {
      const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (dist < ship.radius + a.radius) return true;
    }
    // ship vs bounds
    if (
      ship.x - ship.radius < 0 ||
      ship.x + ship.radius > canvas.width ||
      ship.y - ship.radius < 0 ||
      ship.y + ship.radius > canvas.height
    ) {
      return true;
    }
    return false;
  }

  function drawShip() {
    // Draw ship as a simple upward-pointing triangle
    const size = ship.radius;
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - size); // tip
    ctx.lineTo(ship.x - size, ship.y + size);
    ctx.lineTo(ship.x + size, ship.y + size);
    ctx.closePath();
    ctx.fill();
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 10, 30);
  }

  function gameLoop(timestamp) {
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
      return;
    }
    const delta = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    gameState.score = (timestamp - gameState.startTime) / 1000;

    // spawn asteroids
    if (timestamp - lastSpawn > gameState.spawnInterval) {
      asteroids.push(new Asteroid());
      // subtle spawn beep
      playTone(400, 0.03);
      lastSpawn = timestamp;
      // increase difficulty gradually
      if (gameState.spawnInterval > 400) gameState.spawnInterval -= 20;
      gameState.speedIncrease += 0.02;
    }

    // update entities
    updateShip();
    for (const a of asteroids) a.update();
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].isOffScreen()) asteroids.splice(i, 1);
    }

    // collision check
    if (checkCollisions()) {
      gameState.gameOver = true;
      // play game over tone
      playTone(150, 0.5);
    }

    // render background and entities
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawShip();
    for (const a of asteroids) a.draw();
    drawScore();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
