// Game: Meteor Dodge
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio context and sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(frequency, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = frequency;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaserSound() { playSound(600, 0.07, 'square'); }
  function playExplosionSound() { playSound(200, 0.2, 'sawtooth'); }
  function playGameOverSound() { playSound(100, 0.5, 'triangle'); }

  // Starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      // Alpha for twinkling effect
      alpha: Math.random() * 0.5 + 0.5,
      // Small delta to vary alpha each frame
      delta: (Math.random() - 0.5) * 0.02,
    });
  }


  // Ship configuration (triangle shape)
  const ship = {
    width: 40, // base width
    height: 30, // height of triangle
    x: width / 2 - 20,
    y: height - 40,
    speed: 5,
    color: '#00aaff',
  };

  // Laser configuration
  const laser = {
    width: 4,
    height: 10,
    speed: 7,
    active: false,
    x: 0,
    y: 0,
    color: '#f00',
  };

  // Meteor pool
  const meteors = [];
  const meteorConfig = {
    minSize: 15,
    maxSize: 40,
    minSpeed: 1,
    maxSpeed: 3,
    spawnInterval: 1000, // ms
    maxReached: 0,
  };

  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;
  let gameOverSoundPlayed = false;

  function drawShip() {
    // Draw ship as a filled triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    // Bottom left corner
    ctx.moveTo(ship.x, ship.y + ship.height);
    // Bottom right corner
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    // Top middle point
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawLaser() {
    if (!laser.active) return;
    // Laser with glowing gradient
    const grad = ctx.createLinearGradient(laser.x, laser.y, laser.x, laser.y + laser.height);
    grad.addColorStop(0, '#ff6666');
    grad.addColorStop(1, '#ff0000');
    ctx.fillStyle = grad;
    ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
  }

  function drawStars() {
    stars.forEach(star => {
      // Update alpha for twinkling
      star.alpha += star.delta;
      if (star.alpha <= 0.2 || star.alpha >= 1) star.delta = -star.delta;
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawMeteors() {
    // Draw meteors as circles with radial gradient
    meteors.forEach(m => {
      const gradient = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        0,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      gradient.addColorStop(0, '#ff9966');
      gradient.addColorStop(1, '#663300');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function updateMeteors(delta) {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * delta;
      // Check collision with ship
      if (!gameOver && rectIntersect(m, ship)) {
        gameOver = true;
      }
      // Check if reached bottom
      if (m.y > height) {
        meteorConfig.maxReached++;
        meteors.splice(i, 1);
        if (meteorConfig.maxReached >= 5) gameOver = true;
        continue;
      }
      // Check collision with laser
      if (laser.active && rectIntersect(m, laser)) {
        meteors.splice(i, 1);
        laser.active = false;
        score++;
        // play explosion sound
        playExplosionSound();
      }
    }
  }

  function spawnMeteor() {
    const size = randomBetween(meteorConfig.minSize, meteorConfig.maxSize);
    const x = Math.random() * (width - size);
    const speed = randomBetween(meteorConfig.minSpeed, meteorConfig.maxSpeed);
    meteors.push({ x, y: -size, size, speed });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.width && a.x + a.size > b.x && a.y < b.y + b.height && a.y + a.size > b.y;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function updateLaser(delta) {
    if (!laser.active) return;
    laser.y -= laser.speed * delta;
    if (laser.y + laser.height < 0) laser.active = false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space' && !laser.active && !gameOver) {
      laser.active = true;
      laser.x = ship.x + ship.width / 2 - laser.width / 2;
      laser.y = ship.y;
      playLaserSound();
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function updateShip() {
    if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys['ArrowRight']) ship.x = Math.min(width - ship.width, ship.x + ship.speed);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = (timestamp - lastTime) / 16; // normalize to ~60fps steps
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);

    // draw background stars first
    drawStars();

    if (!gameOver) {
      // spawn meteors based on interval
      if (timestamp - lastSpawn > meteorConfig.spawnInterval) {
        spawnMeteor();
        lastSpawn = timestamp;
      }
      updateShip();
      updateMeteors(delta);
      updateLaser(delta);
    }

    drawShip();
    drawLaser();
    drawMeteors();

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      if (!gameOverSoundPlayed) {
        playGameOverSound();
        gameOverSoundPlayed = true;
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
