// Game based on IDEA.md – Orb Escape
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Resize to fill parent or set a default size
  const resize = () => {
    canvas.width = canvas.clientWidth || 800;
    canvas.height = canvas.clientHeight || 600;
  };
  resize();
  window.addEventListener('resize', resize);

  // ----- Input handling & direction -----
  const keys = {};
  let playerDir = 0; // angle in radians
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    // update direction based on arrow keys
    if (e.key === 'ArrowUp') playerDir = -Math.PI / 2;
    else if (e.key === 'ArrowDown') playerDir = Math.PI / 2;
    else if (e.key === 'ArrowLeft') playerDir = Math.PI;
    else if (e.key === 'ArrowRight') playerDir = 0;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Entities -----
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 12, // length of triangle side
    speed: 3,
    draw() {
      // draw rotated triangle representing the player
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(playerDir);
      // add glow effect
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(-this.size, this.size);
      ctx.lineTo(this.size, this.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      if (keys['ArrowUp']) this.y -= this.speed;
      if (keys['ArrowDown']) this.y += this.speed;
      if (keys['ArrowLeft']) this.x -= this.speed;
      if (keys['ArrowRight']) this.x += this.speed;
      // keep inside bounds
      this.x = Math.max(0, Math.min(canvas.width, this.x));
      this.y = Math.max(0, Math.min(canvas.height, this.y));
    },
  };

  const orbs = [];
  const coins = [];
  const particles = []; // explosion particles
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  let score = 0;
  let gameOver = false;

  // ----- Helper functions -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  const spawnOrb = () => {
    // spawn at random edge
    const edge = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const speed = rand(0.5, 1.5);
    const radius = rand(10, 20);
    if (edge === 0) { // top
      x = rand(0, canvas.width);
      y = -radius;
      vx = rand(-1, 1) * speed;
      vy = speed;
    } else if (edge === 1) { // right
      x = canvas.width + radius;
      y = rand(0, canvas.height);
      vx = -speed;
      vy = rand(-1, 1) * speed;
    } else if (edge === 2) { // bottom
      x = rand(0, canvas.width);
      y = canvas.height + radius;
      vx = rand(-1, 1) * speed;
      vy = -speed;
    } else { // left
      x = -radius;
      y = rand(0, canvas.height);
      vx = speed;
      vy = rand(-1, 1) * speed;
    }
    orbs.push({ x, y, vx, vy, radius, growth: rand(0.05, 0.15) });
  };

  const spawnCoin = () => {
    const radius = 8;
    const x = rand(radius, canvas.width - radius);
    const y = rand(radius, canvas.height - radius);
    coins.push({ x, y, radius, hue: rand(40, 60) }); // golden hue
  };

  // particle for explosion effect
  const spawnParticle = (x, y) => {
    const pCount = 12;
    for (let i = 0; i < pCount; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1, 3);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: rand(2, 4),
        life: rand(30, 50),
        hue: rand(0, 360),
      });
    }
  };

  // initial spawns
  for (let i = 0; i < 5; i++) spawnOrb();
  for (let i = 0; i < 3; i++) spawnCoin();

  // ----- Game Loop -----
  const update = () => {
    if (gameOver) return;
    player.update();

    // update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x += o.vx;
      o.y += o.vy;
      o.radius += o.growth;
      // remove if out of screen far enough
      if (o.x < -100 || o.x > canvas.width + 100 || o.y < -100 || o.y > canvas.height + 100) {
        orbs.splice(i, 1);
        spawnOrb();
      }
    }

    // update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.radius *= 0.96;
      if (p.life <= 0 || p.radius < 0.5) {
        particles.splice(i, 1);
      }
    }

    // coin collection
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (distance(player.x, player.y, c.x, c.y) < c.radius + player.size) {
        score++;
        // create small burst on collect
        spawnParticle(c.x, c.y);
        // play collect sound
        beep(300, 0.08);
        coins.splice(i, 1);
        spawnCoin();
      }
    }

    // collision with orbs -> game over with explosion
    for (const o of orbs) {
      if (distance(player.x, player.y, o.x, o.y) < o.radius + player.size) {
        gameOver = true;
        // spawn explosion particles at player location
        spawnParticle(player.x, player.y);
        // play game over sound
        beep(100, 0.3);
        break;
      }
    }
  };

  const draw = () => {
    // clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw orbs with radial gradient
    for (const o of orbs) {
      const grad = ctx.createRadialGradient(o.x, o.y, o.radius * 0.3, o.x, o.y, o.radius);
      grad.addColorStop(0, 'rgba(255,80,80,0.9)');
      grad.addColorStop(1, 'rgba(150,0,0,0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw particles (explosion sparks)
    for (const p of particles) {
      ctx.fillStyle = `hsla(${p.hue},100%,50%,${Math.max(p.life/50,0)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw coins with subtle gradient
    for (const c of coins) {
      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.3, c.x, c.y, c.radius);
      grad.addColorStop(0, `hsl(${c.hue},80%,60%)`);
      grad.addColorStop(1, `hsl(${c.hue},80%,40%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw player
    player.draw();
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 30);
    }
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // restart handler
  window.addEventListener('keydown', e => {
    if (gameOver && e.key.toLowerCase() === 'r') {
      // reset state
      score = 0;
      gameOver = false;
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      orbs.length = 0;
      coins.length = 0;
      for (let i = 0; i < 5; i++) spawnOrb();
      for (let i = 0; i < 3; i++) spawnCoin();
    }
  });
})();
