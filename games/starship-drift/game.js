// Simple endless runner starship game
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playSound(200, 0.05); }
  function playFuel() { playSound(600, 0.1); }
  function playCrash() { playSound(100, 0.3); }

  // Game state
  let score = 0;
  let fuel = 100;
  const keys = { ArrowUp: false, Space: false };

  // Background stars
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // Starship
  const ship = {
    x: width / 2,
    y: height - 80,
    radius: 12,
    vx: 0,
    vy: 0,
    thrust: -0.2,
    drag: 0.99,
draw() {
        // draw ship as a simple triangular craft
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x - this.radius, this.y + this.radius);
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.closePath();
        ctx.fill();
        // thrust flame when accelerating
        if (keys.ArrowUp || keys.Space) {
          ctx.fillStyle = '#f80';
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + this.radius);
          ctx.lineTo(this.x - this.radius / 2, this.y + this.radius + 6);
          ctx.lineTo(this.x + this.radius / 2, this.y + this.radius + 6);
          ctx.closePath();
          ctx.fill();
        }
      },
update() {
        if (keys.ArrowUp || keys.Space) {
          this.vy += this.thrust;
          fuel = Math.max(0, fuel - 0.1);
          playThrust();
        }
      this.vy *= this.drag;
      this.y += this.vy;
      // keep within bounds
      if (this.y > height - this.radius) this.y = height - this.radius;
      if (this.y < this.radius) this.y = this.radius;
    }
  };

  // Obstacles & fuel cells
  const obstacles = [];
  const fuels = [];
  const spawnInterval = 90; // frames
  let frame = 0;

  function spawn() {
    // asteroid
    const size = 15 + Math.random() * 20;
    obstacles.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: 1 + Math.random() * 2,
      angle: 0,
      angularSpeed: (Math.random() - 0.5) * 0.1,
      draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.angle);
        // asteroid as irregular polygon
        ctx.fillStyle = '#555';
        ctx.beginPath();
        const points = 7;
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const radius = this.size / 2 * (0.6 + Math.random() * 0.4);
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      },
      update() {
        this.y += this.speed;
        this.angle += this.angularSpeed;
      }
    });
    // fuel cell (10% chance)
    if (Math.random() < 0.1) {
      const fSize = 10;
      fuels.push({
        x: Math.random() * (width - fSize),
        y: -fSize,
        size: fSize,
        speed: 1.5,
        draw() {
          ctx.fillStyle = '#ff0';
          ctx.fillRect(this.x, this.y, this.size, this.size);
        },
        update() { this.y += this.speed; }
      });
    }
  }

  function checkCollisions() {
    // ship vs obstacles
    for (const o of obstacles) {
      const dx = ship.x - (o.x + o.size / 2);
      const dy = ship.y - (o.y + o.size / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + o.size / 2) return true;
    }
    // ship vs fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
if (ship.x > f.x && ship.x < f.x + f.size && ship.y > f.y && ship.y < f.y + f.size) {
          fuel = Math.min(100, fuel + 20);
          playFuel();
          fuels.splice(i, 1);
        }
    }
    return false;
  }

  function update() {
    frame++;
    if (frame % spawnInterval === 0) spawn();
    // update background stars
    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });
    ship.update();
    obstacles.forEach(o => o.update());
    fuels.forEach(f => f.update());
    // remove off‑screen obstacles and fuels
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();
    while (fuels.length && fuels[0].y > height) fuels.shift();
    if (checkCollisions() || fuel <= 0) {
      playCrash();
      cancelAnimationFrame(rAF);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    score += 0.05;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#888';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // game objects
    ship.draw();
    obstacles.forEach(o => o.draw());
    fuels.forEach(f => {
      ctx.fillStyle = '#ff0';
      ctx.fillRect(f.x, f.y, f.size, f.size);
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}`, 10, 40);
  }

  function loop() {
    update();
    draw();
    rAF = requestAnimationFrame(loop);
  }
  // input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp' || e.code === 'Space') keys[e.code] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp' || e.code === 'Space') keys[e.code] = false;
  });
  let rAF = requestAnimationFrame(loop);
})();
