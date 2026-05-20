// Cosmic Courier – simple endless runner
// Assumes a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playSound(200, 0.05); }
  function playCollect() { playSound(600, 0.1); }
  function playCrash() { playSound(100, 0.3); }

  // Fit canvas to window
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ----- Game objects -----
  const ship = {
    x: 80,
    y: canvas.height / 2,
    w: 40,
    h: 30,
    dy: 0,
    speed: 5,
    thrust: false,
    draw() {
      // hull gradient
      const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#004');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
      // thrust flame when accelerating upward
      if (this.thrust) {
        ctx.fillStyle = '#ff8';
        ctx.beginPath();
        ctx.moveTo(this.x - this.w / 2, this.y);
        ctx.lineTo(this.x - this.w / 2 - 10, this.y - 5);
        ctx.lineTo(this.x - this.w / 2 - 10, this.y + 5);
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
  }

  const asteroids = [];
  const cargo = [];
  let asteroidTimer = 0;
  let cargoTimer = 0;
  let score = 0;
  let gameOver = false;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Helpers -----
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ----- Game loop -----
  function update(dt) {
    if (gameOver) return;
    // ship movement and thrust flag
    const movingUp = keys['ArrowUp'] || keys['w'];
    if (movingUp) ship.y -= ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed;
    ship.thrust = movingUp; // for flame visual
    if (movingUp) playThrust();
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));

    // stars (parallax + slight twinkle)
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
        s.r = Math.random() * 2 + 1; // varying size for twinkle effect
      }
    }

    // spawn asteroids
    asteroidTimer -= dt;
    if (asteroidTimer <= 0) {
      asteroidTimer = 1500; // ms
      const size = Math.random() * 30 + 20;
      asteroids.push({ x: canvas.width + size, y: Math.random() * (canvas.height - size), w: size, h: size, speed: 3 + Math.random() * 2, angle: Math.random() * Math.PI * 2, angularSpeed: (Math.random() - 0.5) * 0.02 });
    }
    // update asteroids (position + rotation)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      a.angle += a.angularSpeed * dt; // rotate over time
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      else if (rectIntersect(ship, a)) {
        gameOver = true;
        break;
      }
    }

    // spawn cargo pods
    cargoTimer -= dt;
    if (cargoTimer <= 0) {
      cargoTimer = 2500; // ms
      const size = 20;
      cargo.push({ x: canvas.width + size, y: Math.random() * (canvas.height - size), w: size, h: size, speed: 3, collected: false });
    }
    // update cargo
    for (let i = cargo.length - 1; i >= 0; i--) {
      const c = cargo[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) cargo.splice(i, 1);
      else if (!c.collected && rectIntersect(ship, c)) {
        c.collected = true;
        score += 10;
        cargo.splice(i, 1);
      }
    }
  }

  function draw() {
    // Background gradient for depth
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship with gradient hull and thrust visual
    ship.draw();

    // asteroids with rotation and subtle shading
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.w * 0.2, 0, 0, a.w / 2);
      grad.addColorStop(0, '#a55');
      grad.addColorStop(1, '#300');
      ctx.fillStyle = grad;
      ctx.fillRect(-a.w / 2, -a.h / 2, a.w, a.h);
      ctx.restore();
    }

    // cargo pods with rounded corners
    ctx.fillStyle = '#ff0';
    for (const c of cargo) {
      const r = 4; // corner radius
      ctx.beginPath();
      ctx.moveTo(c.x + r, c.y);
      ctx.lineTo(c.x + c.w - r, c.y);
      ctx.quadraticCurveTo(c.x + c.w, c.y, c.x + c.w, c.y + r);
      ctx.lineTo(c.x + c.w, c.y + c.h - r);
      ctx.quadraticCurveTo(c.x + c.w, c.y + c.h, c.x + c.w - r, c.y + c.h);
      ctx.lineTo(c.x + r, c.y + c.h);
      ctx.quadraticCurveTo(c.x, c.y + c.h, c.x, c.y + c.h - r);
      ctx.lineTo(c.x, c.y + r);
      ctx.quadraticCurveTo(c.x, c.y, c.x + r, c.y);
      ctx.closePath();
      ctx.fill();
    }

    // score display
    ctx.fillStyle = '#0f0';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 20, 30);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
