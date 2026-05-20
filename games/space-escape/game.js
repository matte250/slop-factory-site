// Simple Space Escape game
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playLaserSound() { playTone(800, 100); }
  function playExplosionSound() { playTone(200, 300); }
  function playGameOverSound() { playTone(100, 1000); }

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 5,
    cooldown: 0
  };

  // Lasers
  const lasers = [];

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 90; // frames
  let asteroidTimer = 0;

  // Starfield
  const stars = [];
  const STAR_COUNT = 100;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        bright: Math.random() < 0.2 // 20% bright
      });
    }
  }
  initStars();

  // Input state
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Score
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20; // 20-50px
    const speed = Math.random() * 2 + 1; // 1-3px per frame
    const x = Math.random() * (WIDTH - size);
    asteroids.push({ x, y: -size, size, speed });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(WIDTH - ship.w, ship.x));

    // Fire laser
    if (keys['Space'] && ship.cooldown <= 0) {
      lasers.push({ x: ship.x + ship.w / 2, y: ship.y, dy: -7 });
      playLaserSound();
      ship.cooldown = 15; // frames between shots
    }
    if (ship.cooldown > 0) ship.cooldown--;

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y += l.dy;
      if (l.y < 0) lasers.splice(i, 1);
    }

    // Spawn asteroids
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidSpawnInterval;
    } else {
      asteroidTimer--;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship
      if (
        a.y + a.size > ship.y &&
        a.x < ship.x + ship.w &&
        a.x + a.size > ship.x
      ) {
          playGameOverSound();
          gameOver = true;
      }
      // Collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (
          l.x > a.x && l.x < a.x + a.size &&
          l.y > a.y && l.y < a.y + a.size
        ) {
          score += Math.round(a.size);
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }
      // Remove off-screen asteroids
      if (a.y > HEIGHT) asteroids.splice(i, 1);
    }
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#09081f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Small starfield
    stars.forEach(s => {
      ctx.fillStyle = s.bright ? '#fff' : '#888';
      ctx.fillRect(s.x, s.y, 2, 2);
    });

    // Draw ship as triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw lasers with glow
    lasers.forEach(l => {
      const grad = ctx.createLinearGradient(0, l.y, 0, l.y + 10);
      grad.addColorStop(0, 'rgba(255,255,0,0)');
      grad.addColorStop(0.5, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(l.x - 2, l.y, 4, 10);
    });

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      radGrad.addColorStop(0, '#b5651d');
      radGrad.addColorStop(1, '#5c3317');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', WIDTH / 2 - 80, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
