// Game: Asteroid Dodge – simple endless arcade
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, type = 'sine', duration = 0.2) => {
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

  // Adjust canvas size to fill its container or use defaults
  const resize = () => {
    canvas.width = canvas.clientWidth || 800;
    canvas.height = canvas.clientHeight || 600;
  };
  resize();
  window.addEventListener('resize', resize);

  // Create starfield background
  const stars = [];
  const STAR_COUNT = 100;
  const initStars = () => {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5
      });
    }
  };
  initStars();

  // Ship definition – simple triangle with gradient fill
  const ship = {
  const ship = {
    width: 40,
    height: 20,
    x: 0,
    y: 0,
    speed: 5,
    init() {
      this.x = canvas.width / 2 - this.width / 2;
      this.y = canvas.height - this.height - 10;
    },
    draw() {
    // Gradient fill for ship
    const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    }
  };
  ship.init();

  // Input handling – left/right arrows / A D keys
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid pool
  const asteroids = [];
  const asteroidProto = {
    radius: 15,
    x: 0,
    y: 0,
    speed: 2,
    reset() {
      this.radius = 10 + Math.random() * 15;
      this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
      this.y = -this.radius;
      this.speed = 2 + Math.random() * 3 + score / 100; // accelerate with score
      // subtle ping when an asteroid re‑appears
      playTone(300, 'triangle', 0.05);
    },
    update() {
      this.y += this.speed;
      if (this.y - this.radius > canvas.height) this.reset();
    },
    draw() {
      // Radial gradient for a 3D rock look
      const grad = ctx.createRadialGradient(
        this.x,
        this.y,
        this.radius * 0.2,
        this.x,
        this.y,
        this.radius
      );
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Spawn initial asteroids
  for (let i = 0; i < 5; i++) {
    const a = Object.create(asteroidProto);
    a.reset();
    // stagger start positions
    a.y = -Math.random() * canvas.height;
    asteroids.push(a);
  }

  let score = 0;
  let gameOver = false;

  const update = () => {
    if (gameOver) return;
    // move ship
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // update asteroids
    asteroids.forEach(a => a.update());
    // Move stars for a subtle parallax effect
    const STAR_SPEED = 0.3;
    stars.forEach(star => {
      star.y += STAR_SPEED;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    // collision detection (simple AABB vs circle)
    for (const a of asteroids) {
      const cx = ship.x + ship.width / 2;
      const cy = ship.y + ship.height / 2;
      const distX = Math.abs(a.x - cx);
      const distY = Math.abs(a.y - cy);
      if (distX > (ship.width / 2 + a.radius) || distY > (ship.height / 2 + a.radius)) continue;
      if (distX <= ship.width / 2 || distY <= ship.height / 2) { gameOver = true; break; }
      const dx = distX - ship.width / 2;
      const dy = distY - ship.height / 2;
      if (dx * dx + dy * dy <= a.radius * a.radius) { gameOver = true; break; }
    }

    if (!gameOver) score++;
  };

  const draw = () => {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0d0d25');
    bgGrad.addColorStop(1, '#000020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'white';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ship.draw();
    asteroids.forEach(a => a.draw());
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
