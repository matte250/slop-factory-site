// game.js – implements the Cosmic Runner concept.
// Canvas element with id="game" is expected in the HTML.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id="game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Ship definition – a simple triangle.
  const ship = {
    w: 30,
    h: 40,
    x: width / 2,
    y: height - 60,
    speed: 5,
    draw() {
      // Ship with simple gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#006');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
  };

  // Star field for background
  const starCount = 120;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Asteroid pool.
  const asteroids = [];
  let asteroidSpeed = 2;
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, w: size, h: size });
  }

  function update() {
    if (gameOver) return;
    // Move ship based on input.
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    // Keep ship within bounds.
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Spawn asteroids.
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }

    // Update asteroids.
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += asteroidSpeed;
      // Remove off‑screen.
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Increase difficulty gradually.
    asteroidSpeed += 0.0005;
    score++;

    // Collision detection.
    for (const a of asteroids) {
      if (
        ship.x + ship.w / 2 > a.x &&
        ship.x - ship.w / 2 < a.x + a.w &&
        ship.y + ship.h > a.y &&
        ship.y < a.y + a.h
      ) {
        gameOver = true;
        // Play crash sound
        playTone(150, 0.3);
        break;
      }
    }
  }

  function draw() {
    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw star field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      // twinkle effect
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s.phase + performance.now() / 500);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Draw ship.
    ship.draw();
    // Draw asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score.
    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '40px monospace';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  const keys = {};
  let audioResumed = false;
  function resumeAudio() {
    if (!audioResumed) {
      audioCtx.resume();
      audioResumed = true;
    }
  }
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    resumeAudio();
    // Play movement sound
    if (e.key === 'ArrowLeft' || e.key === 'a') playTone(400, 0.05);
    else if (e.key === 'ArrowRight' || e.key === 'd') playTone(600, 0.05);
  });
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game.
  loop();
})();
