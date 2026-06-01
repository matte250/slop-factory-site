// game.js – simple endless‑scroll spaceship game
// Canvas with id "game" must exist in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let lastThrustTime = 0;
  const thrustCooldown = 100; // ms
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() {
    const now = Date.now();
    if (now - lastThrustTime < thrustCooldown) return;
    lastThrustTime = now;
    playTone(200, 'sawtooth', 0.07);
  }
  function playCollect() { playTone(600, 'triangle', 0.12); }
  function playCrash() { playTone(100, 'square', 0.3); }

  // track if crash sound played
  let crashPlayed = false;
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // --- Game objects -------------------------------------------------------
  // background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  const ship = {
    thrust: false,
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 40,
    speed: 5,
    dx: 0,
    dy: 0,
    draw() {
      // ship with gradient and slight stroke
      const grad = ctx.createLinearGradient(this.x - this.w/2, this.y, this.x + this.w/2, this.y + this.h);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0aa';
      ctx.lineWidth = 1;
      ctx.stroke();
      // thrust flame when moving
      if (this.thrust) {
        const flameGrad = ctx.createRadialGradient(this.x, this.y + this.h, 0, this.x, this.y + this.h + 10, 10);
        flameGrad.addColorStop(0, '#ff8');
        flameGrad.addColorStop(1, '#f00');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.h);
        ctx.lineTo(this.x - this.w / 4, this.y + this.h + 15);
        ctx.lineTo(this.x + this.w / 4, this.y + this.h + 15);
        ctx.closePath();
        ctx.fill();
      }
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside canvas
      this.x = Math.max(this.w / 2, Math.min(width - this.w / 2, this.x));
      this.y = Math.max(0, Math.min(height - this.h, this.y));
    },
  };

  const asteroids = [];
  const powerUps = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // --- Helpers -----------------------------------------------------------
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() {
    const size = rand(20, 50);
    asteroids.push({
      x: rand(size / 2, width - size / 2),
      y: -size,
      r: size / 2,
      speed: rand(2, 5),
    });
  }

  function spawnPowerUp() {
    const size = 15;
    powerUps.push({
      x: rand(size, width - size),
      y: -size,
      r: size / 2,
      speed: 3,
    });
  }

  function circleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  }

  // --- Input -------------------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    ship.thrust = false;
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft) { ship.dx = -ship.speed; ship.thrust = true; }
    if (keys.ArrowRight) { ship.dx = ship.speed; ship.thrust = true; }
    if (keys.ArrowUp) { ship.dy = -ship.speed; ship.thrust = true; }
    if (keys.ArrowDown) { ship.dy = ship.speed; ship.thrust = true; }
  }
    ship.thrust = false;
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft) { ship.dx = -ship.speed; ship.thrust = true; }
    if (keys.ArrowRight) { ship.dx = ship.speed; ship.thrust = true; }
    if (keys.ArrowUp) { ship.dy = -ship.speed; ship.thrust = true; }
    if (keys.ArrowDown) { ship.dy = ship.speed; ship.thrust = true; }
  }
    ship.thrust = false;
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft) { ship.dx = -ship.speed; ship.thrust = true; }
    if (keys.ArrowRight) { ship.dx = ship.speed; ship.thrust = true; }
    if (keys.ArrowUp) { ship.dy = -ship.speed; ship.thrust = true; }
    if (keys.ArrowDown) { ship.dy = ship.speed; ship.thrust = true; }
  }
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
  }

  // --- Main loop ----------------------------------------------------------
  function update() { // update stars
    // play thrust sound if moving
    if (ship.thrust) playThrust();
    // reset crash flag when game restarts (not needed now)
    
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > height) {
      s.y = 0;
      s.x = Math.random() * width;
    }
  });
    if (gameOver) return;
    frame++;
    if (frame % 60 === 0) spawnAsteroid(); // one per second
    if (frame % 300 === 0) spawnPowerUp(); // every 5 seconds

    handleInput();
    ship.update();

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship
if (circleCollision({x: ship.x, y: ship.y, r: ship.w / 2}, a)) {
          if (!crashPlayed) { playCrash(); crashPlayed = true; }
          gameOver = true;
        }
      // remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // move power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (circleCollision({x: ship.x, y: ship.y, r: ship.w / 2}, p)) {
        score += 10;
        powerUps.splice(i, 1);
        continue;
      }
      if (p.y - p.r > height) powerUps.splice(i, 1);
    }
  }

  function draw() {
    // background gradient (deep space)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#001');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // stars (small white points)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship (draw once)
    ship.draw();

    // asteroids (gray with subtle outline)
    ctx.fillStyle = '#555';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // power‑ups (glowing yellow)
    ctx.fillStyle = '#ff0';
    powerUps.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
