// Cosmic Dodger - minimal implementation
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type='sine', duration=0.1) {
    // Ensure AudioContext is running (required after user gesture)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Game state -----
  const player = { x: 80, y: height / 2, w: 30, h: 20, speed: 4 };
  const particles = []; // explosion particles
  const lasers = [];
  const obstacles = [];
  const stars = [];
  let keys = {};
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  window.addEventListener('blur', () => keys = {});

  // ----- Helper functions -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ----- Game loop -----
  function update(dt) {
    if (gameOver) return;
    // move player
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(width - player.w, player.x));
    player.y = Math.max(0, Math.min(height - player.h, player.y));
    // fire laser
if (keys[' ']) {
      // simple rate limit
      if (!player.lastShot || performance.now() - player.lastShot > 200) {
        lasers.push({ x: player.x + player.w, y: player.y + player.h / 2 - 2, w: 10, h: 4, speed: 8 });
        player.lastShot = performance.now();
        playSound(600, 'square', 0.08); // laser fire
      }
    }
    }
    // update lasers
    lasers.forEach(l => l.x += l.speed);
    for (let i = lasers.length - 1; i >= 0; i--) if (lasers[i].x > width) lasers.splice(i, 1);
    // spawn obstacles
    if (Math.random() < 0.02) {
      const size = rand(20, 50);
      obstacles.push({ x: width, y: rand(0, height - size), w: size, h: size, speed: rand(2, 5) });
    }
    // spawn stars (points)
    if (Math.random() < 0.01) {
      const s = 8;
      stars.push({ x: width, y: rand(0, height - s), w: s, h: s, speed: 2 });
    }
    // move obstacles and stars
    obstacles.forEach(o => o.x -= o.speed);
    stars.forEach(s => s.x -= s.speed);
    // update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // collision detection
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (rectCollision(player, o)) { gameOver = true; break; }
      for (let j = lasers.length - 1; j >= 0; j--) {
        if (rectCollision(lasers[j], o)) {
          lasers.splice(j, 1);
          obstacles.splice(i, 1);
          score += 10;
          // create explosion particles
          for (let p = 0; p < 12; p++) {
            particles.push({
              x: o.x + o.w / 2,
              y: o.y + o.h / 2,
              vx: rand(-1.5, 1.5),
              vy: rand(-1.5, 1.5),
              size: rand(2, 4),
              life: 30
            });
          }
          playSound(200, 'sawtooth', 0.15); // explosion sound
          break;
        }
      }
    }

          break;
        }
      }
    }
    // collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      if (rectCollision(player, stars[i])) {
        stars.splice(i, 1);
        score += 5;
      }
    }
    for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    for (let i = stars.length - 1; i >= 0; i--) if (stars[i].x + stars[i].w < 0) stars.splice(i, 1);
    const now = performance.now();
    score = Math.floor(score + (now - startTime) / 1000);
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // moving starfield (parallax)
    if (!window.bgStars) window.bgStars = [];
    // spawn distant stars
    if (Math.random() < 0.2) {
      window.bgStars.push({ x: width, y: rand(0, height), size: rand(1, 2), speed: rand(0.3, 0.8), alpha: Math.random() * 0.5 + 0.3 });
    }
    // update and draw stars
    for (let i = window.bgStars.length - 1; i >= 0; i--) {
      const s = window.bgStars[i];
      s.x -= s.speed;
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
      if (s.x + s.size < 0) window.bgStars.splice(i, 1);
    }
    // player ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    shipGrad.addColorStop(0, '#00ff80');
    shipGrad.addColorStop(1, '#006640');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h / 2);
    ctx.lineTo(player.x + player.w, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // lasers with glow
    lasers.forEach(l => {
      const grad = ctx.createLinearGradient(l.x, 0, l.x + l.w, 0);
      grad.addColorStop(0, 'rgba(255,255,0,0.2)');
      grad.addColorStop(0.5, 'rgba(255,255,0,1)');
      grad.addColorStop(1, 'rgba(255,255,0,0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(l.x, l.y, l.w, l.h);
    });
    // obstacles (asteroids) with radial gradient
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w*0.1, o.x + o.w/2, o.y + o.h/2, o.w/2);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // stars (points)
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.w, s.h));
    // explosion particles
    particles.forEach(p => {
      const alpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (window.lastRender || timestamp);
    window.lastRender = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
