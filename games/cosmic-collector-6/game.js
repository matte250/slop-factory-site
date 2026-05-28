// Enhanced canvas game with improved graphics and sounds
(() => {
  // Sound manager using Web Audio API
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
  const sounds = {
    thrust: () => playTone(400, 0.05, 'triangle'),
    collect: () => playTone(800, 0.1, 'sine'),
    hit: () => playTone(200, 0.2, 'sawtooth'),
    gameOver: () => {
      // three low beeps
      let t = 0;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playTone(150, 0.3, 'square'), t);
        t += 400;
      }
    },
  };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Resize canvas to full window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // ==== Game State ==== //
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };
  const minerals = [];
  const asteroids = [];
  const stars = [];
  const particles = [];
  let score = 0;
  let shield = 3;
  let gameOver = false;

  // ==== Helper Functions ==== //
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const spawnMineral = () => {
    minerals.push({
      x: rand(20, canvas.width - 20),
      y: rand(20, canvas.height - 20),
      r: 8,
    });
  };

  const spawnAsteroid = () => {
    const a = {
      x: rand(20, canvas.width - 20),
      y: rand(20, canvas.height - 20),
      r: rand(12, 20),
      vx: rand(-0.5, 0.5),
      vy: rand(-0.5, 0.5),
    };
    asteroids.push(a);
  };

  const initStars = (count = 100) => {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        radius: rand(0.5, 1.5),
        speed: rand(0.1, 0.4),
      });
    }
  };

  // initial objects
  for (let i = 0; i < 5; i++) spawnMineral();
  for (let i = 0; i < 3; i++) spawnAsteroid();
  initStars();

  // ==== Input ==== //
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.code] = true));
  window.addEventListener('keyup', (e) => (keys[e.code] = false));

  const createParticle = (x, y, angle) => {
    const speed = rand(1, 2);
    particles.push({
      x,
      y,
      vx: Math.cos(angle + Math.PI) * speed,
      vy: Math.sin(angle + Math.PI) * speed,
      life: rand(20, 40),
    });
  };

  const updateShip = () => {
    if (keys['ArrowLeft']) ship.angle -= 0.07;
    if (keys['ArrowRight']) ship.angle += 0.07;
    if (keys['ArrowUp']) {
      // ensure audio context is running
      if (audioCtx.state !== 'running') audioCtx.resume();
      sounds.thrust();
      const thrust = 0.12;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      createParticle(ship.x, ship.y, ship.angle);
    }
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;
  };

  const updateStars = () => {
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = rand(0, canvas.width);
      }
    });
  };

  const updateParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  };

  const checkCollisions = () => {
    // minerals
    for (let i = minerals.length - 1; i >= 0; i--) {
        if (dist(ship, minerals[i]) < ship.radius + minerals[i].r) {
          minerals.splice(i, 1);
          score++;
          shield = Math.min(3, shield + 0.1);
          spawnMineral();
          sounds.collect();
        }
    }
    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += canvas.width;
      if (a.x > canvas.width) a.x -= canvas.width;
      if (a.y < 0) a.y += canvas.height;
      if (a.y > canvas.height) a.y -= canvas.height;

        if (dist(ship, a) < ship.radius + a.r) {
          shield--;
          sounds.hit();
          asteroids.splice(i, 1);
          spawnAsteroid();
          if (shield <= 0) {
            gameOver = true;
            sounds.gameOver();
          }
        }
    }
  };

  const drawShip = () => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body gradient
    const grad = ctx.createLinearGradient(-12, 0, 12, 0);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#0ff');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const draw = () => {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // particles (thrust)
    particles.forEach(p => {
      const alpha = p.life / 40;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // minerals with glow
    minerals.forEach(m => {
      const radGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      radGrad.addColorStop(0, 'yellow');
      radGrad.addColorStop(0.6, 'orange');
      radGrad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // asteroids with texture gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship
    drawShip();

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Shield: ${shield.toFixed(1)}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    }
  };

  const loop = () => {
    if (!gameOver) {
      updateShip();
      checkCollisions();
      updateStars();
      updateParticles();
    }
    draw();
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
