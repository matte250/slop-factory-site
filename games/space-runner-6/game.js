// Simple top‑down endless runner
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume audio context on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  let lastThrustTime = 0;

  // Player ship (triangle spaceship)
  const ship = { x: width / 2, y: height - 60, w: 30, h: 30, speed: 4 };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const obstacles = [];
  const starCount = 100;
  const stars = [];
  // Initialize stars with random positions, speed, and brightness
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 0.5,
      brightness: `rgba(255,255,255,${0.3 + Math.random() * 0.7})`
    });
  }
  // Particle trail for the ship
  const particles = [];
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  let distance = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }

  function update(dt) {
    // move ship
    const moved = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // play thrust sound when moving
    if (moved && performance.now() - lastThrustTime > 100) {
      playTone(300, 0.08);
      lastThrustTime = performance.now();
    }

    // add particle trail
    particles.push({
      x: ship.x + ship.w / 2,
      y: ship.y + ship.h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.5 + Math.random() * 0.5,
      life: 30,
      size: 2 + Math.random() * 2,
    });

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // remove off‑screen
      if (o.y > height) obstacles.splice(i, 1);
      // collision
      if (!gameOver &&
          ship.x < o.x + o.w && ship.x + ship.w > o.x &&
          ship.y < o.y + o.h && ship.y + ship.h > o.y) {
        gameOver = true;
        playTone(100, 0.5);
      }
    }

    distance += dt * 0.01; // simple distance metric
  }

  function drawStarfield() {
    // Fill background with dark gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Update and draw moving stars for a parallax effect
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
      ctx.fillStyle = s.brightness;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
  }

  function draw() {
    drawStarfield();
    // particle trail (fading circles)
    particles.forEach(p => {
      const alpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = `rgba(0,255,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship (triangle spaceship with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // obstacles (asteroid-like with radial gradient)
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w * 0.1,
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Distance: ${Math.floor(distance)} m`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
