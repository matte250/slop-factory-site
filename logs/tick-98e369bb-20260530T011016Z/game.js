// Orbit Defender game
// Canvas with id="game" must exist in the HTML.
// The player rotates a shield around a planet to block incoming asteroids.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  // Audio setup
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playBlockSound() { playTone(800, 0.08); }
  function playHitSound() { playTone(200, 0.2); }

  const planet = {
    x: width / 2,
    y: height / 2,
    radius: 30,
    health: 3,
  };

  const shield = {
    radius: 60,
    angle: 0, // radians, 0 points to the right
    width: (Math.PI / 6), // 30° arc
    speed: 0.04, // rotation per frame when key held
  };

  const asteroids = [];
  // Star field for background
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.5,
    });
  }
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 1.5;
  let lastSpawn = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  let audioStarted = false;
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    // Ensure audio context is resumed on first interaction
    if (!audioStarted) {
      audioCtx.resume().then(() => {
        audioStarted = true;
      });
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
  });

  function spawnAsteroid() {
    // Choose a random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -10;
        break;
      case 1: // right
        x = width + 10;
        y = Math.random() * height;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + 10;
        break;
      case 3: // left
        x = -10;
        y = Math.random() * height;
        break;
    }
    // Vector toward planet center
    const dx = planet.x - x;
    const dy = planet.y - y;
    const len = Math.hypot(dx, dy);
    const vx = (dx / len) * asteroidSpeed;
    const vy = (dy / len) * asteroidSpeed;
    asteroids.push({ x, y, vx, vy, radius: 8 });
  }

  function normalizeAngle(a) {
    // Keep angle between -π and π
    while (a <= -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    return a;
  }

  function angleBetween(dx, dy) {
    return normalizeAngle(Math.atan2(dy, dx));
  }

  function update(dt) {
    if (gameOver) return;
    // Rotate shield based on input
    if (keys.ArrowLeft) shield.angle -= shield.speed;
    if (keys.ArrowRight) shield.angle += shield.speed;
    shield.angle = normalizeAngle(shield.angle);

    // Spawn asteroids
    const now = performance.now();
    if (now - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;

      // Check collision with shield (angular overlap)
      const dx = a.x - planet.x;
      const dy = a.y - planet.y;
      const ang = angleBetween(dx, dy);
      const diff = Math.abs(normalizeAngle(ang - shield.angle));
      if (diff < shield.width / 2) {
        // Blocked
        playBlockSound();
        asteroids.splice(i, 1);
        continue;
      }

      // Check collision with planet
      const dist = Math.hypot(dx, dy);
      if (dist <= planet.radius) {
        planet.health--;
        asteroids.splice(i, 1);
        if (planet.health <= 0) {
          gameOver = true;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw planet with radial gradient
    const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.radius * 0.2, planet.x, planet.y, planet.radius);
    planetGrad.addColorStop(0, '#6ab7ff');
    planetGrad.addColorStop(1, '#1a3d7a');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw shield with glow
    const shieldGrad = ctx.createRadialGradient(
      planet.x,
      planet.y,
      shield.radius - 10,
      planet.x,
      planet.y,
      shield.radius
    );
    shieldGrad.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    shieldGrad.addColorStop(1, 'rgba(255, 165, 0, 0)');
    ctx.strokeStyle = shieldGrad;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(
      planet.x,
      planet.y,
      shield.radius,
      shield.angle - shield.width / 2,
      shield.angle + shield.width / 2
    );
    ctx.stroke();

    // Draw asteroids
    ctx.fillStyle = '#999';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw health
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + planet.health, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
