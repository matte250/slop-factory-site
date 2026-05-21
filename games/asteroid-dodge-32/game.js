// Simple Asteroid Dodge game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or use fixed size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Star field background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Thrust particles
  const particles = [];

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playThrust() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }


  // ------- Game objects -------
  class Ship {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.radius = 15;
      this.angle = 0; // radians, 0 points up
      this.velocity = { x: 0, y: 0 };
      this.rotationSpeed = Math.PI / 180 * 3; // 3 deg per frame
      this.thrust = 0.1;
    }
    rotate(dir) {
      this.angle += dir * this.rotationSpeed;
    }
    accelerate() {
      this.velocity.x += Math.sin(this.angle) * this.thrust;
      this.velocity.y -= Math.cos(this.angle) * this.thrust;
    }
    update() {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      // screen wrap
      if (this.x < 0) this.x += canvas.width;
      if (this.x > canvas.width) this.x -= canvas.width;
      if (this.y < 0) this.y += canvas.height;
      if (this.y > canvas.height) this.y -= canvas.height;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // Ship body gradient (green to dark green)
      const grad = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
      grad.addColorStop(0, '#00ff00');
      grad.addColorStop(1, '#006600');
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  class Asteroid {
    constructor() {
      this.radius = Math.random() * 20 + 15;
      // spawn at random edge
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: // top
          this.x = Math.random() * canvas.width;
          this.y = -this.radius;
          break;
        case 1: // right
          this.x = canvas.width + this.radius;
          this.y = Math.random() * canvas.height;
          break;
        case 2: // bottom
          this.x = Math.random() * canvas.width;
          this.y = canvas.height + this.radius;
          break;
        case 3: // left
          this.x = -this.radius;
          this.y = Math.random() * canvas.height;
          break;
      }
      const speed = Math.random() * 1.5 + 0.5;
      const dir = Math.random() * Math.PI * 2;
      this.velocity = { x: Math.cos(dir) * speed, y: Math.sin(dir) * speed };
    }
    update() {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#888';
      ctx.fill();
    }
    isOffScreen() {
      return (
        this.x < -this.radius ||
        this.x > canvas.width + this.radius ||
        this.y < -this.radius ||
        this.y > canvas.height + this.radius
      );
    }
  }

  // ------- Game state -------
  const ship = new Ship();
  let asteroids = [];
  let keys = {};
  let gameOver = false;
  let spawnTimer = 0;

  // Input handling
  window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  // resume audio context on first interaction
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function checkCollision() {
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        gameOver = true;
        playExplosion();
        break;
      }
    }
  }

  function update() {
    if (gameOver) return;

    // controls
    if (keys['ArrowLeft']) ship.rotate(-1);
    if (keys['ArrowRight']) ship.rotate(1);
    if (keys['ArrowUp']) {
      ship.accelerate();
      // create thrust particles and sound
      playThrust();
      for (let i = 0; i < 3; i++) {
        const angle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 1 + 0.5;
        particles.push({
          x: ship.x,
          y: ship.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30,
          maxLife: 30,
        });
      }
    }

    ship.update();

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Asteroid handling
    spawnTimer--;
    if (spawnTimer <= 0) {
      asteroids.push(new Asteroid());
      spawnTimer = Math.max(30, 120 - asteroids.length * 5); // faster spawn over time
    }
    asteroids.forEach(a => a.update());
    asteroids = asteroids.filter(a => !a.isOffScreen());

    checkCollision();
  }

  function draw() {
    // Draw space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });
    // draw ship and effects
    ship.draw();
    // thrust particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    asteroids.forEach(a => a.draw());
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
