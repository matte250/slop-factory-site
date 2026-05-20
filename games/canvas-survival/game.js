// Simple endless runner – Canvas Survival
// HTML must contain <canvas id="game"></canvas>

(() => {
  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 400;

  // Ship definition
  const ship = {
    x: 50,
    y: height / 2,
    w: 30,
    h: 20,
    speed: 4,
    draw() {
      // Draw ship as a simple triangle pointing right
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidFreq = 90; // frames between spawns
  let frameCount = 0;

  // Fuel management
  let fuel = 100; // percent
  const fuelBurn = 0.03; // per frame

  let gameOver = false;

  // Input handling
  const keys = { ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      // Play a subtle thrust sound when moving up or down
      playTone(400, 0.05);
    }
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    // Play a short blip when an asteroid appears
    playTone(300, 0.05);
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      speed: Math.random() * 2 + 2,
    });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    ship.y = Math.max(ship.h / 2, Math.min(height - ship.h / 2, ship.y));

    // Fuel
    fuel -= fuelBurn;
    if (fuel <= 0) {
      fuel = 0;
      endGame();
    }

    // Asteroids
    if (frameCount % asteroidFreq === 0) spawnAsteroid();
    frameCount++;
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y - ship.h / 2 < a.y + a.h &&
        ship.y + ship.h / 2 > a.y
      ) {
        endGame();
        break;
      }
    }
  }

  function draw() {
    // Space background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Ship (triangle)
    ship.draw();
    // Asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.fillRect(a.x, a.y, a.w, a.h);
    }
    // Fuel bar background
    ctx.fillStyle = '#444';
    ctx.fillRect(10, 30, 100, 10);
    // Fuel level
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 30, fuel, 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 30, 100, 10);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 55);
  }

  function endGame() {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    }
  }

  // Start the game
  requestAnimationFrame(loop);
})();
