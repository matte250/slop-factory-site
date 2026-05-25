// Minimal game based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill parent
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // generate starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5 + 0.5 });
  }

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    health: 3,
    score: 0,
  };

  const obstacles = [];
  const particles = [];
  const obstacleSpawnInterval = 2000; // ms
  let lastSpawn = 0;
  const now = () => performance.now();
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on user interaction
  window.addEventListener('click', () => { audioCtx.resume(); });
  function playTone(freq, duration = 0.1, type = 'sine', volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.05, 'square', 0.1); }
  function playCollision() { playTone(100, 0.2, 'sawtooth', 0.3); }
  function playGameOver() { playTone(50, 0.5, 'triangle', 0.5); }
  // emit particles for effects
  function emitParticles(x, y, color) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 15 + Math.random() * 10,
        color,
      });
    }
  }

function spawnObstacle() {
    // obstacles are simple circles, we'll give them a gradient later in draw
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    switch (side) {
      case 0: // top
        x = Math.random() * canvas.width; y = -20; vx = 0; vy = speed; break;
      case 1: // right
        x = canvas.width + 20; y = Math.random() * canvas.height; vx = -speed; vy = 0; break;
      case 2: // bottom
        x = Math.random() * canvas.width; y = canvas.height + 20; vx = 0; vy = -speed; break;
      case 3: // left
        x = -20; y = Math.random() * canvas.height; vx = speed; vy = 0; break;
    }
    obstacles.push({ x, y, vx, vy, radius: 12 + Math.random() * 8 });
  }

  function update(dt) {
  // update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
    // input
    if (keys['ArrowLeft']) player.angle -= 0.08;
    if (keys['ArrowRight']) player.angle += 0.08;
    if (keys['ArrowUp']) {
      const thrust = 0.1;
      player.vx += Math.cos(player.angle) * thrust;
      player.vy += Math.sin(player.angle) * thrust;
      // emit thrust particles
      emitParticles(player.x, player.y, '#ff8');
      playThrust();
    }
    // drift forward constantly
    const drift = 0.02;
    player.vx += Math.cos(player.angle) * drift;
    player.vy += Math.sin(player.angle) * drift;

    player.x += player.vx * dt;
    player.y += player.vy * dt;
    // simple friction
    player.vx *= 0.99;
    player.vy *= 0.99;

    // boundary health loss
    if (player.x < 0 || player.x > canvas.width || player.y < 0 || player.y > canvas.height) {
      player.health = Math.max(0, player.health - 1);
      // keep player inside
      player.x = Math.max(0, Math.min(canvas.width, player.x));
      player.y = Math.max(0, Math.min(canvas.height, player.y));
    }

    // obstacles update and collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      // remove off‑screen
      if (o.x < -40 || o.x > canvas.width + 40 || o.y < -40 || o.y > canvas.height + 40) {
        obstacles.splice(i, 1);
        continue;
      }
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      const dist = Math.hypot(dx, dy);
if (dist < o.radius + player.radius) {
          player.health = Math.max(0, player.health - 1);
          obstacles.splice(i, 1);
          playCollision();
        }
    }

    // spawn obstacles
    if (now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = now();
    }

    // score based on time survived
    player.score += dt * 0.01;
  }

  function draw() {
    // dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw starfield
    // draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw particles
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / 25);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // draw player ship (triangle)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw obstacles
    ctx.fillStyle = '#f44';
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Health: ${player.health}`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(player.score)}`, 10, 40);
  }

  let lastTime = now();
  function loop() {
    const nowTime = now();
    const dt = (nowTime - lastTime) / 16; // normalize to ~60fps unit
    lastTime = nowTime;
    if (player.health > 0) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      playGameOver();
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }
  requestAnimationFrame(loop);
})();
