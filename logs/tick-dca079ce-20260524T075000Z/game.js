// game.js – simple asteroid‑dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Canvas size (fallback if not set in HTML/CSS)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Ship configuration
  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
  };

  // Asteroid data
  const stars = [];
  const starCount = 100;
  // Initialize stars
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  const asteroids = [];
  const asteroidSize = 30;
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames between spawns
  let speedIncrease = 0.001; // acceleration per frame

  // Score and state
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  function spawnAsteroid() {
    const x = Math.random() * (canvas.width - asteroidSize);
    asteroids.push({ x, y: -asteroidSize, w: asteroidSize, h: asteroidSize, v: 2 });
    // Sound for asteroid spawn
    playTone(200, 0.05);
  }

  function update() {
    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(canvas.width - ship.w, ship.x + ship.speed);

    // Spawn asteroids periodically
    if (asteroidTimer++ >= asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }

    // Update asteroid positions
    asteroids.forEach(a => {
      a.v += speedIncrease;
      a.y += a.v;
    });

    // Remove passed asteroids, update score, check collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
if (a.y > canvas.height) {
          asteroids.splice(i, 1);
          score++;
          // Sound for successful dodge / score increment
          playTone(600, 0.05);
        } else if (rectsCollide(a, ship)) {
          // Sound for collision / game over
          playTone(400, 0.2);
          gameOver = true;
        }
    }
  }

  function rectsCollide(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  function draw() {
    // Background (starfield)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (circles)
    asteroids.forEach(a => {
      ctx.fillStyle = '#a33';
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with overlay
    }
  }

  // Kick‑off the game loop
  requestAnimationFrame(loop);
})();
