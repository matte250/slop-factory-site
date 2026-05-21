// Minimal Orbit Escape game based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, type = 'sine', duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- Background stars -----
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
    });
  }

  // ----- Player -----
  const shipTrail = [];
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    turnSpeed: 0.07,
    fuel: 100,
    draw() {
      // thrust flame
      if (keys['ArrowUp']) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-22, -6);
        ctx.lineTo(-22, 6);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
      }
      // ship body
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      const grad = ctx.createRadialGradient(0, 0, 3, 0, 0, this.radius);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#060');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    },
    update() {
      // Apply inertia
      this.x += this.vx;
      this.y += this.vy;
      // Screen wrap
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
      // Fuel consumption
      if (this.fuel > 0) this.fuel -= 0.02;
      // trail
      shipTrail.push({ x: this.x, y: this.y });
      if (shipTrail.length > 20) shipTrail.shift();
    },
  };

  // ----- Controls -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidCount = 8;
  for (let i = 0; i < asteroidCount; i++) {
    asteroids.push({
      x: rand(0, width),
      y: rand(0, height),
      r: rand(20, 40),
      vx: rand(-0.5, 0.5),
      vy: rand(-0.5, 0.5),
    });
  }

  // ----- Fuel Cells -----
  const fuels = [];
  const spawnFuel = () => {
    fuels.push({
      x: rand(0, width),
      y: rand(0, height),
      r: 6,
    });
  };
  spawnFuel();

  // ----- Game State -----
  let score = 0;
  let highScore = parseInt(localStorage.getItem('orbitHighScore') || '0', 10);
  let gameOver = false;

  let audioStarted = false;
function ensureAudio() {
  if (!audioStarted && audioCtx.state === 'suspended') {
    audioCtx.resume();
    audioStarted = true;
  }
}
function handleInput() {
    ensureAudio();
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // thrust sound
      playTone(300, 'sine', 0.05);
    }
  }

  function updateAsteroids() {
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    }
  }

  function checkCollisions() {
    // Ship vs asteroids
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.r) {
        gameOver = true;
        // crash sound
        playTone(120, 'sawtooth', 0.3);
        return;
      }
    }
    // Ship vs fuel
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (dist(ship, f) < ship.radius + f.r) {
        score++;
        ship.fuel = Math.min(100, ship.fuel + 20);
        fuels.splice(i, 1);
        // spawn new fuel after short delay
        setTimeout(spawnFuel, 500);
        // collect sound
        playTone(800, 'square', 0.1);
      }
    }
    // Fuel depletion
    if (ship.fuel <= 0) {
      gameOver = true;
      playTone(100, 'sine', 0.2);
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      // move star for parallax effect
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
    }
    // Ship trail
    ctx.strokeStyle = 'rgba(0,255,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < shipTrail.length; i++) {
      const p = shipTrail[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    // Ship
    ship.draw();
    // Asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel cells with glow
    for (const f of fuels) {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    ctx.fillText(`High: ${highScore}`, 10, 60);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 10);
    }
  }

  function loop() {
    if (!gameOver) {
      handleInput();
      ship.update();
      updateAsteroids();
      checkCollisions();
    } else {
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('orbitHighScore', highScore);
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Start
  loop();
})();
