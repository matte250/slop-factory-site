// Simple Astro Escape game – targets <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCollisionSound() {
    const duration = 0.2;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // ----- ship -----
  const ship = {
    x: width / 2,
    y: height - 60,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.07,
    update() {
      // apply velocity
      this.x += this.vx;
      this.y += this.vy;
      // screen wrap
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
    },
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fillStyle = '#0f0';
      ctx.fill();
      ctx.restore();
    }
  };

  // ----- asteroids -----
  const asteroids = [];
  // background stars for better graphics
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 0.3 + 0.1
    });
  }
  const minSize = 8;
  function spawnAsteroid() {
    const size = Math.random() * 20 + 20; // radius 20‑40
    asteroids.push({
      x: Math.random() * width,
      y: -size,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 0.7 + 0.2,
      radius: size
    });
  }

  function splitAsteroid(a) {
    if (a.radius / 2 < minSize) return;
    for (let i = 0; i < 2; i++) {
      asteroids.push({
        x: a.x,
        y: a.y,
        vx: a.vx + (Math.random() - 0.5) * 1,
        vy: a.vy + (Math.random() - 0.5) * 1,
        radius: a.radius / 2
      });
    }
  }

  // ----- input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- game state -----
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  function update(dt) {
  // update background stars
  for (let s of stars) {
    s.y += s.speed * dt * 0.05; // speed proportional to dt
    if (s.y > height) {
      s.y = 0;
      s.x = Math.random() * width;
    }
  }
    if (gameOver) return;
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    ship.update();

    // spawn asteroids every 1.5 s
    if (performance.now() - lastSpawn > 1500) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // wrap vertically
      if (a.y - a.radius > height) asteroids.splice(i, 1);
      // ship‑asteroid collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        return;
      }
      // asteroid‑asteroid collision – split
      for (let j = i - 1; j >= 0; j--) {
        const b = asteroids[j];
        const ddx = a.x - b.x;
        const ddy = a.y - b.y;
        const d = Math.hypot(ddx, ddy);
        if (d < a.radius + b.radius) {
          splitAsteroid(a);
          splitAsteroid(b);
          asteroids.splice(i, 1);
          asteroids.splice(j, 1);
          break;
        }
      }
    }
  }

  function draw() {
    // background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw moving stars
    ctx.fillStyle = 'white';
    for (let s of stars) {
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.clearRect(0, 0, width, height);
    // ship
    ship.draw();
    // asteroids
    ctx.fillStyle = '#aaa';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
