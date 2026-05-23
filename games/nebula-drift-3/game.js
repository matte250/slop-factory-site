// Minimal top‑down space game targeting canvas id="game"
// Ship drifts forward, player rotates (←/→) and thrusts (↑) to dodge asteroids.
// Shield decreases on collision; power‑ups restore shield or give temporary invincibility.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;

  // ----- utilities -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // generate starfield for background
  const starCount = 200;
  const stars = Array.from({ length: starCount }, () => ({
    x: rand(0, width),
    y: rand(0, height),
    r: rand(0.5, 2)
  }));

  // ----- ship -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.05,
    turnSpeed: 0.04,
    shield: 100,
    invincible: 0, // frames left
    update() {
      // rotation handled by key state
      // thrust
      if (keys['ArrowUp']) {
        this.vx += Math.cos(this.angle) * this.thrust;
        this.vy += Math.sin(this.angle) * this.thrust;
        playThrust();
      }
      // move
      this.x += this.vx;
      this.y += this.vy;
      // simple drag
      this.vx *= 0.99;
      this.vy *= 0.99;
      // wrap around edges
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
      if (this.invincible > 0) this.invincible--;
    },
    draw() {
      // thruster flame when thrusting
      if (keys['ArrowUp']) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-18, -4);
        ctx.lineTo(-18, 4);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
      }
      // ship body with gradient
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, this.invincible > 0 ? 'gold' : '#ddd');
      grad.addColorStop(1, this.invincible > 0 ? '#b8860b' : '#777');
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  };

  // ----- asteroids -----
  const asteroids = [];
  const spawnAsteroid = () => {
    const edge = Math.floor(rand(0, 4)); // 0: top,1:right,2:bottom,3:left
    let x, y, vx, vy;
    const speed = rand(0.5, 1.5);
    switch (edge) {
      case 0: x = rand(0, width); y = -20; vx = rand(-1, 1); vy = speed; break;
      case 1: x = width + 20; y = rand(0, height); vx = -speed; vy = rand(-1, 1); break;
      case 2: x = rand(0, width); y = height + 20; vx = rand(-1, 1); vy = -speed; break;
      case 3: x = -20; y = rand(0, height); vx = speed; vy = rand(-1, 1); break;
    }
    asteroids.push({ x, y, vx, vy, radius: rand(15, 30) });
  };
  // initial asteroids
  for (let i = 0; i < 5; i++) spawnAsteroid();

  // ----- power‑ups -----
  const powerUps = [];
  const spawnPowerUp = () => {
    const x = rand(0, width);
    const y = rand(0, height);
    const type = Math.random() < 0.5 ? 'shield' : 'invincibility';
    powerUps.push({ x, y, radius: 8, type, ttl: 600 }); // frames left
  };

  // spawn timers
  let asteroidTimer = 0;
  let powerUpTimer = 0;

  // ----- input & audio -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state !== 'running') audioCtx.resume(); });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(300, 0.05, 'square');
  const playCollision = () => playTone(100, 0.2, 'sawtooth');
  const playPowerUp = () => playTone(600, 0.15, 'triangle');
  const playGameOver = () => playTone(50, 1, 'sine');


  // ----- main loop -----
  let gameOver = false;
  const loop = () => {
    if (gameOver) return;
    // draw dark background and stars
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      // twinkle effect
      const radius = s.r * (0.8 + Math.random() * 0.4);
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // update ship
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    ship.update();
    ship.draw();

    // asteroids
    asteroidTimer++;
    if (asteroidTimer > 120) { // roughly every 2 seconds
      spawnAsteroid();
      asteroidTimer = 0;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -20) a.x = width + 20;
      if (a.x > width + 20) a.x = -20;
      if (a.y < -20) a.y = height + 20;
      if (a.y > height + 20) a.y = -20;
      // draw
        // draw asteroid with gradient shading
        const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
        grad.addColorStop(0, '#555');
        grad.addColorStop(1, '#111');
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      // collision with ship
      if (ship.invincible === 0 && dist(ship, a) < ship.radius + a.radius) {
        ship.shield -= 20;
        playCollision();
        // remove asteroid
        asteroids.splice(i, 1);
        if (ship.shield <= 0) {
          gameOver = true;
        }
      }
    }

    // power‑ups
    powerUpTimer++;
    if (powerUpTimer > 600) { // every 10 seconds
      spawnPowerUp();
      powerUpTimer = 0;
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.ttl--;
        // draw power‑up with glow
        const puGrad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, p.radius);
        puGrad.addColorStop(0, p.type === 'shield' ? '#0f0' : '#ffa500');
        puGrad.addColorStop(1, p.type === 'shield' ? '#030' : '#800');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = puGrad;
        ctx.fill();
      // collision with ship
      if (dist(ship, p) < ship.radius + p.radius) {
          if (p.type === 'shield') ship.shield = Math.min(100, ship.shield + 30);
          else ship.invincible = 300; // 5 seconds at 60fps
          playPowerUp();
          powerUps.splice(i, 1);
        } else if (p.ttl <= 0) {
          powerUps.splice(i, 1);
        }
    }

    // UI – shield bar
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Shield: ' + Math.max(0, ship.shield), 10, 20);

    if (!gameOver) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };
  requestAnimationFrame(loop);
})();
