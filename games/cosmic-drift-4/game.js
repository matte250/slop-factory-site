// Minimal cosmic drift game targeting <canvas id="game"></canvas>
// Arrow keys: ←/→ rotate, ↑ thrust. Collect orbs, avoid asteroids.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // simple tone generator
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);

  const keys = {};
  addEventListener('keydown', e => {
  keys[e.key] = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
  addEventListener('keyup', e => (keys[e.key] = false));

  class Ship {
    constructor() { this.x = canvas.width/2; this.y = canvas.height/2; this.vx = 0; this.vy = 0; this.angle = 0; this.r = 12; }
    update() {
      if (keys['ArrowLeft']) this.angle -= 0.06;
      if (keys['ArrowRight']) this.angle += 0.06;
      if (keys['ArrowUp']) { this.vx += Math.cos(this.angle) * 0.2; this.vy += Math.sin(this.angle) * 0.2; playTone(400, 0.08); }
      this.x += this.vx; this.y += this.vy;
      // simple drag
      this.vx *= 0.99; this.vy *= 0.99;
      // wrap
      if (this.x < 0) this.x += canvas.width; else if (this.x > canvas.width) this.x -= canvas.width;
      if (this.y < 0) this.y += canvas.height; else if (this.y > canvas.height) this.y -= canvas.height;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(this.r, 0);
      ctx.lineTo(-this.r, this.r/2);
      ctx.lineTo(-this.r, -this.r/2);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
  }

  class Asteroid {
    constructor() {
      const edge = Math.random() < 0.5 ? 'x' : 'y';
      if (edge === 'x') { this.x = Math.random() * canvas.width; this.y = Math.random() < 0.5 ? -20 : canvas.height + 20; }
      else { this.x = Math.random() < 0.5 ? -20 : canvas.width + 20; this.y = Math.random() * canvas.height; }
      this.r = 15 + Math.random()*20;
      const angle = Math.atan2(canvas.height/2 - this.y, canvas.width/2 - this.x);
      const speed = 1 + Math.random()*1.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
    update() { this.x += this.vx; this.y += this.vy; }
    draw() {
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    offScreen() { return this.x < -50 || this.x > canvas.width+50 || this.y < -50 || this.y > canvas.height+50; }
  }

  class Orb {
    constructor() {
      this.x = Math.random()*canvas.width;
      this.y = Math.random()*canvas.height;
      this.r = 6;
    }
    draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fillStyle = '#0f0'; ctx.fill(); }
  }

  const ship = new Ship();
  const asteroids = [];
  const orbs = [];
  const stars = [];
  // generate starfield
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.5,
      color: '#fff'
    });
  }
  let score = 0;
  let gameOver = false;
  let lastAsteroid = 0;
  let lastOrb = 0;

  function spawnAsteroid() {
    asteroids.push(new Asteroid());
    lastAsteroid = performance.now();
  }

  function spawnOrb() {
    orbs.push(new Orb());
    lastOrb = performance.now();
  }

  function dist(ax, ay, bx, by) { return Math.hypot(ax-bx, ay-by); }

  function update() {
    if (gameOver) return;
    const now = performance.now();
    if (now - lastAsteroid > 2000) spawnAsteroid();
    if (now - lastOrb > 3000) spawnOrb();
    ship.update();
    // update asteroids
    for (let i = asteroids.length-1; i>=0; i--) { const a = asteroids[i]; a.update(); if (a.offScreen()) asteroids.splice(i,1); }
    // check collisions
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < ship.r + a.r) {
        playTone(100, 0.4); // crash sound
        gameOver = true; break; }
    }
    // collect orbs
    for (let i = orbs.length-1; i>=0; i--) {
      const o = orbs[i];
if (dist(ship.x, ship.y, o.x, o.y) < ship.r + o.r) {
          score++;
          playTone(600, 0.05); // collect sound
          orbs.splice(i,1);
        }
    }
  }

  function draw() {
    // background starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // draw ship with glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    ship.draw();
    ctx.shadowBlur = 0;
    // draw asteroids with subtle shading
    for (const a of asteroids) a.draw();
    // draw orbs with radial gradient
    for (const o of orbs) {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#030');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: '+score, 20, 30);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('GAME OVER', canvas.width/2 - 150, canvas.height/2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
