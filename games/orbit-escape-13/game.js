// Orbit Escape – enhanced graphics
// Targets a <canvas id="game"> in the surrounding HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Fill canvas size – you can adjust as needed
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur / 1000);
    osc.start(now);
    osc.stop(now + dur / 1000);
  }

  // generate starfield
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
  };

  class Asteroid {
    constructor() {
      const edge = Math.random() < 0.5 ? 'x' : 'y';
      this.x = edge === 'x' ? (Math.random() < 0.5 ? 0 : canvas.width) : Math.random() * canvas.width;
      this.y = edge === 'y' ? (Math.random() < 0.5 ? 0 : canvas.height) : Math.random() * canvas.height;
      const speed = 0.5 + Math.random() * 0.5;
      const dir = Math.random() * Math.PI * 2;
      this.vx = Math.cos(dir) * speed;
      this.vy = Math.sin(dir) * speed;
      this.r = 15 + Math.random() * 25;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.03;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.spin;
      // wrap around edges
      if (this.x < -this.r) this.x = canvas.width + this.r;
      if (this.x > canvas.width + this.r) this.x = -this.r;
      if (this.y < -this.r) this.y = canvas.height + this.r;
      if (this.y > canvas.height + this.r) this.y = -this.r;
    }
    draw() {
      // draw irregular polygon to represent asteroid
      const points = 8;
      const step = (Math.PI * 2) / points;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = i * step;
        const noise = (Math.random() - 0.5) * 0.4; // random variation
        const radius = this.r + noise * this.r;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  const asteroids = [];
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let gameOver = false;
  let startTime = performance.now();
  let score = 0;

  function update(dt) {
    // ship rotation
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    // thrust
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // thrust sound
      playTone(500, 80);
    }
    // apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap ship
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // spawn asteroids over time, speed up
    if (performance.now() - lastSpawn > spawnInterval) {
      asteroids.push(new Asteroid());
      lastSpawn = performance.now();
      // gradually increase difficulty
      spawnInterval = Math.max(500, spawnInterval - 50);
    }

    // update asteroids and check collisions
    for (const a of asteroids) {
      a.update();
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.r + ship.radius) {
          // collision sound
          playTone(200, 300);
          gameOver = true;
          break;
        }
    }
    if (!gameOver) {
      score = Math.floor((performance.now() - startTime) / 1000);
    }
  }

  function draw() {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield with subtle twinkle
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      // twinkle: random slight radius change each frame
      const twinkle = (Math.random() - 0.5) * 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.3, s.radius + twinkle), 0, Math.PI * 2);
      ctx.fill();
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body gradient
    const grad = ctx.createLinearGradient(-12, 0, 12, 0);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#080');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // asteroids
    for (const a of asteroids) a.draw();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    if (!gameOver) {
      update(dt);
      draw();
      lastTime = timestamp;
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with overlay
    }
  }

  requestAnimationFrame(loop);
})();
