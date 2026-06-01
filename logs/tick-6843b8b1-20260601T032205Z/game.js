// Asteroid Dodge game script targeting canvas with id="game"
(() => {
  // create a simple starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
    }
  }

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Ship definition
  const ship = {
    x: 50,
    y: height / 2,
    size: 20,
    speed: 5,
    draw() {
      ctx.fillStyle = '#0f0';
      // draw a triangle pointing right
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size / 2);
      ctx.lineTo(this.x, this.y + this.size / 2);
      ctx.lineTo(this.x + this.size, this.y);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); // simple move tone
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      playTone(440, 0.05);
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroid pool
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 15; // 15-35
    const y = Math.random() * (height - size) + size / 2;
    const speed = 2 + frame / 500; // gradually faster
    asteroids.push({ x: width + size, y, size, speed });
    // play a subtle tone when an asteroid appears
    playTone(220, 0.03);
  }

  function update() {
    if (gameOver) return;
    // Move ship based on arrow keys
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep ship within bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // Spawn asteroids
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Remove when off screen
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }

    // Collision detection (circle-rectangle approximation)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const distance = Math.hypot(dx, dy);
      if (distance < a.size + ship.size / 2) {
        // Collision sound
        playTone(660, 0.2);
        gameOver = true;
        break;
      }
    }

    // Increment score
    score = Math.floor(frame / 60);
    frame++;
  }

  function draw() {
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Starfield
    drawStars();

    // Draw ship with gradient
    ship.draw();

    // Draw asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with Game Over overlay
    }
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
