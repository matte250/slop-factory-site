// Void Runner – simple endless canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // ----- Star field background -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.5 + 0.5
    });
  }

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playSound(200);
  const playCollect = () => playSound(600);
  const playExplosion = () => playSound(100);


  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---- Player ----
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    fuel: 100,
    thrust: 0.15,
    turnSpeed: 0.07,
    maxSpeed: 4,
    update() {
      if (keys['ArrowLeft']) this.angle -= this.turnSpeed;
      if (keys['ArrowRight']) this.angle += this.turnSpeed;
      if (keys['ArrowUp'] && this.fuel > 0) {
        // play thrust sound
        playThrust();
        this.vx += Math.cos(this.angle) * this.thrust;
        this.vy += Math.sin(this.angle) * this.thrust;
        this.fuel = Math.max(0, this.fuel - 0.2);
      }
      // limit speed
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > this.maxSpeed) {
        this.vx *= this.maxSpeed / speed;
        this.vy *= this.maxSpeed / speed;
      }
      this.x += this.vx;
      this.y += this.vy;
      // wrap around edges
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
    },
  draw() {
    ctx.clearRect(0, 0, width, height);
    // star field
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship
    ship.draw();
    // asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // glowing orbs
    for (const o of orbs) {
      if (o.collected) continue;
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2);
      grad.addColorStop(0, 'rgba(0,255,0,0.8)');
      grad.addColorStop(1, 'rgba(0,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
  };

  // ---- Asteroids ----
  const asteroids = [];
  const spawnAsteroid = () => {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.5, 2);
    const radius = rand(15, 30);
    const side = Math.floor(rand(0, 4)); // 0:left,1:top,2:right,3:bottom
    let x, y;
    if (side === 0) { x = 0; y = rand(0, height); }
    else if (side === 1) { x = rand(0, width); y = 0; }
    else if (side === 2) { x = width; y = rand(0, height); }
    else { x = rand(0, width); y = height; }
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: radius });
  };

  // ---- Orbs ----
  const orbs = [];
  const spawnOrb = () => {
    const radius = 6;
    const x = rand(radius, width - radius);
    const y = rand(radius, height - radius);
    orbs.push({ x, y, r: radius, collected: false });
  };

  // initial spawns
  for (let i = 0; i < 5; i++) spawnAsteroid();
  for (let i = 0; i < 3; i++) spawnOrb();

  let score = 0;
  let gameOver = false;

  const update = () => {
    if (gameOver) return;
    ship.update();
    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.r) a.x = width + a.r;
      if (a.x > width + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = height + a.r;
      if (a.y > height + a.r) a.y = -a.r;
      // collision with ship
      if (dist(a, ship) < a.r + ship.r) {
        playExplosion();
        gameOver = true;
      }
    }
    // check orbs
    for (const o of orbs) {
if (!o.collected && dist(o, ship) < o.r + ship.r) {
          o.collected = true;
          playCollect();
          score += 10;
          ship.fuel = Math.min(100, ship.fuel + 20);
        }
    }
    // remove collected orbs and occasionally spawn new ones
    if (orbs.filter(o => !o.collected).length < 3) spawnOrb();
    // spawn new asteroids over time
    if (Math.random() < 0.01) spawnAsteroid();
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // ship
    ship.draw();
    // asteroids
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // orbs
    ctx.fillStyle = '#0f0';
    for (const o of orbs) {
      if (o.collected) continue;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
