// Simple Canvas Dodge game (top‑down shooter)
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
    if (!canvas) return; // no canvas, abort silently
    const ctx = canvas.getContext('2d');
    // audio context and simple tone player
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, duration) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration);
    }
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- utilities -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // generate simple starfield background with slight drift
  const stars = Array.from({ length: 100 }, () => ({
    x: rand(0, canvas.width),
    y: rand(0, canvas.height),
    r: rand(0.5, 1.5),
    speed: rand(0.1, 0.4), // vertical drift speed
  }));

  // ----- game objects -----
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 15,
    speed: 3,
    angle: 0, // direction ship points
  };

  const bullets = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;
  const particles = []; // explosion particles

  // ----- input handling -----
  const keys = {};
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      // resume audio context on first interaction
      if (audioCtx.state === 'suspended') audioCtx.resume();
    });
    window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- core functions -----
  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4)); // 0: top,1:right,2:bottom,3:left
    let x, y;
    switch (side) {
      case 0:
        x = rand(0, canvas.width);
        y = -20;
        break;
      case 1:
        x = canvas.width + 20;
        y = rand(0, canvas.height);
        break;
      case 2:
        x = rand(0, canvas.width);
        y = canvas.height + 20;
        break;
      case 3:
        x = -20;
        y = rand(0, canvas.height);
        break;
    }
    const angle = Math.atan2(player.y - y, player.x - x);
    const color = `hsl(${rand(0, 360) | 0}, 30%, 60%)`;
    const rot = rand(0, Math.PI * 2);
    const rotSpeed = rand(-0.02, 0.02);
    asteroids.push({ x, y, r: 12 + rand(0, 8), speed: 1 + rand(0, 1.5), angle, color, rot, rotSpeed });
  }

  function update() {
    if (gameOver) return;
    // starfield drift
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = rand(0, canvas.width);
      }
    });
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    // player movement
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
    // update angle to mouse (optional) - keep facing movement direction
    if (keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'] || keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d']) {
      player.angle = Math.atan2(
        (keys['ArrowDown'] || keys['s'] ? 1 : 0) - (keys['ArrowUp'] || keys['w'] ? 1 : 0),
        (keys['ArrowRight'] || keys['d'] ? 1 : 0) - (keys['ArrowLeft'] || keys['a'] ? 1 : 0)
      );
    }
    // firing
if (keys[' '] && bullets.length < 5) {
        // simple rate limit by max bullets on screen
        const bx = player.x + Math.cos(player.angle) * player.r;
        const by = player.y + Math.sin(player.angle) * player.r;
        bullets.push({ x: bx, y: by, r: 3, speed: 6, angle: player.angle });
        // play shooting sound
        playTone(800, 0.08);
      }
    // update bullets
    bullets.forEach(b => {
      b.x += Math.cos(b.angle) * b.speed;
      b.y += Math.sin(b.angle) * b.speed;
    });
    // remove off‑screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    }
    // update asteroids and rotation
    asteroids.forEach(a => {
      a.x += Math.cos(a.angle) * a.speed;
      a.y += Math.sin(a.angle) * a.speed;
      a.rot += a.rotSpeed;
    });
    // collision bullet‑asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (distance(a, b) < a.r + b.r) {
          // create explosion particles
          const particleCount = Math.max(8, Math.floor(a.r / 2));
          for (let p = 0; p < particleCount; p++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(0.5, 2);
            particles.push({
              x: a.x,
              y: a.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: rand(20, 40),
              radius: rand(1, 2),
              color: a.color,
            });
          }
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          break;
        }
      }
    }
    // collision player‑asteroid
    for (const a of asteroids) {
      if (distance(a, player) < a.r + player.r) {
        gameOver = true;
        // play crash sound
        playTone(150, 0.3);
        break;
      }
    }
    // occasional spawning
    if (Math.random() < 0.02) spawnAsteroid();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // starfield background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player ship (triangle) with gradient
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    const shipGrad = ctx.createLinearGradient(-player.r, 0, player.r, 0);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.r, 0);
    ctx.lineTo(-player.r, -player.r * 0.7);
    ctx.lineTo(-player.r, player.r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids with color & rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // explosion particles
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(p.life / 40, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over text
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // start
  loop();
})();
