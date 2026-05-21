// Simple asteroid‑shower game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // generate simple starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // ----- game objects -----
  const ship = { x: width / 2, y: height - 30, w: 40, h: 20, speed: 5 };
  const lasers = [];
  const asteroids = [];
  let left = false, right = false, fire = false;
  let gameOver = false;

  // ----- audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playLaser = () => playTone(600, 100);
  const playExplosion = () => playTone(150, 300);
  const playGameOver = () => playTone(80, 500);

  // ----- input handling -----
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') left = true;
    if (e.code === 'ArrowRight') right = true;
    if (e.code === 'Space') fire = true;
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') left = false;
    if (e.code === 'ArrowRight') right = false;
    if (e.code === 'Space') fire = false;
  });

  // ----- helpers -----
  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const spawnAsteroid = () => {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    const speed = 1 + Math.random() * 2;
    asteroids.push({ x, y: -size, w: size, h: size, speed });
  };

  // ----- main loop -----
  let lastSpawn = 0;
  function update(dt) {
    if (gameOver) return;

    // ship movement
    if (left) ship.x -= ship.speed;
    if (right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // fire lasers
    if (fire) {
      // limit fire rate
      if (!ship.lastShot || Date.now() - ship.lastShot > 200) {
        lasers.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10, speed: 7 });
        ship.lastShot = Date.now();
        playLaser();
      }
    }

    // update lasers
    lasers.forEach(l => l.y -= l.speed);
    // remove off‑screen lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].y + lasers[i].h < 0) lasers.splice(i, 1);
    }

    // spawn asteroids every 1‑1.5 s
    if (Date.now() - lastSpawn > 1000 + Math.random() * 500) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // update asteroids
    asteroids.forEach(a => a.y += a.speed);

    // collisions: laser‑asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // asteroid hits ship?
if (rectCollide(a, ship)) { playGameOver(); gameOver = true; break; }
        // asteroid reaches bottom?
        if (a.y > height) { playGameOver(); gameOver = true; break; }
        for (let j = lasers.length - 1; j >= 0; j--) {
          if (rectCollide(a, lasers[j])) {
            playExplosion();
            asteroids.splice(i, 1);
            lasers.splice(j, 1);
            break;
          }
        }
    }
  }

function draw() {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship – drawn as triangle (already modified)
    // ship drawing code remains unchanged

    // lasers – glow effect
    lasers.forEach(l => {
      const grad = ctx.createLinearGradient(0, l.y + l.h, 0, l.y);
      grad.addColorStop(0, 'rgba(255,0,0,0)');
      grad.addColorStop(1, '#f00');
      ctx.fillStyle = grad;
      ctx.fillRect(l.x, l.y, l.w, l.h);
    });

    // asteroids – radial gradient for a rocky look
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.2,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      radGrad.addColorStop(0, '#bbb');
      radGrad.addColorStop(1, '#555');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship – triangle (original code moved earlier, keep original call)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }
  }

  let last = 0;
  function loop(timestamp) {
    const dt = timestamp - last;
    last = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
