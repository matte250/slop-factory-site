// Asteroid Dodge game with enhanced graphics
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    move(dir) {
      this.x = Math.min(Math.max(this.x + dir * this.speed, 0), width - this.w);
    }
  };

  // Asteroids
  const asteroids = [];
  const spawnRate = 1000; // ms
  let lastSpawn = 0;

  // Stars for background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
    });
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // movement sound
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      beep(400, 0.05);
    }
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // Game state
  let lives = 3;
  let startTime = performance.now();
  let score = 0;

  function update(dt) {
    // Ship control
    if (keys['ArrowLeft']) ship.move(-1);
    if (keys['ArrowRight']) ship.move(1);

    // Asteroids movement
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision
      if (
        a.x < ship.x + ship.w &&
        a.x + a.w > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.h > ship.y
      ) {
        // collision sound
        beep(200, 0.1);
        lives--;
        asteroids.splice(i, 1);
        if (lives <= 0) {
          // Game over sound
          beep(100, 0.5);
          // Game over
          alert('Game Over! Score: ' + Math.floor(score));
          document.location.reload();
          return;
        }
        continue;
      }
      // remove off-screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Spawn new asteroids
    if (performance.now() - lastSpawn > spawnRate) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Score based on survival time
    score = (performance.now() - startTime) / 1000;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw stars
    ctx.fillStyle = '#444';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // draw ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // draw asteroids as circles with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.2, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + lives, 10, 20);
    ctx.fillText('Score: ' + Math.floor(score), 10, 40);
  }

  let lastTime = 0;
  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
