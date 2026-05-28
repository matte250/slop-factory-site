// Minimal Galactic Courier game targeting <canvas id="game">.
// The script sets up canvas, ship physics, obstacle & cargo spawning, score/fuel tracking, and game‑over handling.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;
  // Starfield setup – array of stars for parallax background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      // speed factor for parallax (slower than obstacles)
      speed: 0.2 + Math.random() * 0.3,
    });
  }
  // Thruster particles array
  let particles = [];

  // Game state
  let ship = { x: 80, y: height / 2, w: 30, h: 20, vy: 0 };
  const gravity = 0.4;
  const thrust = -8;
  let obstacles = [];
  let crates = [];
  let score = 0;
  let fuel = 100; // percent
  let gameOver = false;
  let frameCount = 0;

  // Input handling – click or tap applies upward thrust
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playThrust = () => playBeep(300, 100);
  const playCollect = () => playBeep(600, 80);
  const playCrash = () => playBeep(150, 300);

  const applyThrust = () => {
    ship.vy = thrust;
    // generate thruster particles at ship rear
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: ship.x,
        y: ship.y + ship.h / 2 + (Math.random() - 0.5) * 5,
        vx: -2 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 1,
        life: 30 + Math.random() * 20,
      });
    }
    // play thrust sound (resume context if needed)
    if (audioCtx.state !== 'running') audioCtx.resume();
    playThrust();
  };
  canvas.addEventListener('mousedown', applyThrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); applyThrust(); });

  const spawnObstacle = () => {
    const size = 30 + Math.random() * 40;
    obstacles.push({ x: width, y: Math.random() * (height - size), w: size, h: size });
  };

  const spawnCrate = () => {
    const size = 20;
    const isFuel = Math.random() < 0.2; // 20% chance fuel crate
    crates.push({ x: width, y: Math.random() * (height - size), w: size, h: size, fuel: isFuel });
  };

  const rectCollision = (a, b) => (
    a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y
  );

  const update = () => {
    if (gameOver) return;
    frameCount++;

    // Ship physics
    ship.vy += gravity;
    ship.y += ship.vy;
    // Keep ship within bounds for collision detection later
    // (collision with bounds ends game)

    // Fuel consumption
    if (frameCount % 5 === 0) fuel = Math.max(0, fuel - 0.1);

    // Spawn obstacles & crates progressively
    if (frameCount % 90 === 0) spawnObstacle();
    if (frameCount % 150 === 0) spawnCrate();

    // Move obstacles & crates leftward
    const speed = 3 + score / 500; // gradually increase
    obstacles.forEach(o => o.x -= speed);
    crates.forEach(c => c.x -= speed);
    // Move stars for parallax background
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
    });
    // Update thruster particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    // Remove dead particles
    particles = particles.filter(p => p.life > 0);
    // Remove off‑screen items
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    crates = crates.filter(c => c.x + c.w > 0);

    // Collision detection
    for (const o of obstacles) {
      if (rectCollision(ship, o)) { gameOver = true; break; }
    }
    for (let i = crates.length - 1; i >= 0; i--) {
      const c = crates[i];
      if (rectCollision(ship, c)) {
        score += c.fuel ? 0 : 10;
        if (c.fuel) fuel = Math.min(100, fuel + 30);
        crates.splice(i, 1);
      }
    }
    // Edge collisions
    if (ship.y < 0 || ship.y + ship.h > height || fuel <= 0) gameOver = true;

    // Increment score over time
    if (frameCount % 30 === 0) score++;
  };

  const draw = () => {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Background gradient and moving starfield
    // gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#001');
    skyGrad.addColorStop(1, '#000');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // starfield (parallax)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // Thruster particles – fading circles
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${Math.max(p.life / 50, 0)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship – stylized with gradient and outline
    ctx.save();
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y);
    shipGrad.addColorStop(0, '#2f0');
    shipGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0c0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Obstacles – gray asteroids with radial gradient
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w * 0.2,
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crates – gradient colors
    crates.forEach(c => {
      const grad = ctx.createRadialGradient(
        c.x + c.w / 2,
        c.y + c.h / 2,
        c.w * 0.2,
        c.x + c.w / 2,
        c.y + c.h / 2,
        c.w / 2
      );
      if (c.fuel) {
        grad.addColorStop(0, '#0ff');
        grad.addColorStop(1, '#006');
      } else {
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#660');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI – score & fuel bar
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.fillText('Fuel: ' + Math.floor(fuel) + '%', 10, 40);
    // Fuel bar
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 45, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 45, fuel, 10);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText('Score: ' + Math.floor(score), width / 2, height / 2 + 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Click to restart', width / 2, height / 2 + 40);
    }
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Restart handling
  canvas.addEventListener('click', () => {
    if (!gameOver) return;
    // reset state
    ship = { x: 80, y: height / 2, w: 30, h: 20, vy: 0 };
    obstacles = [];
    crates = [];
    score = 0;
    fuel = 100;
    gameOver = false;
    frameCount = 0;
  });

  // Start loop
  loop();
})();
