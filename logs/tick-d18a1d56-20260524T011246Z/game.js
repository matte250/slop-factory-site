// Minimalist endless‑runner game for canvas #game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Game parameters
  const ship = { x: W / 2, y: H - 50, w: 30, h: 30, speed: 4 };
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playStarSound() { beep(440, 120); }
  function playCrashSound() { beep(150, 300); }
  const shipTrail = []; // {x, y, age}

  let left = false,
    right = false;
  const asteroids = [];
  const stars = [];
  const asteroidFreq = 0.02; // per frame
  const starFreq = 0.01;
  const asteroidSpeed = 2;
  const starSpeed = 1.5;
  let timer = 30; // seconds
  let lastTime = performance.now();
  let gameOver = false;

  // Input handlers
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (W - size), y: -size, w: size, h: size });
  }

  function spawnStar() {
    const size = 10;
    stars.push({ x: Math.random() * (W - size), y: -size, w: size, h: size });
  }

  function rectsCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // update ship trail
    shipTrail.forEach(t => t.age++);
    shipTrail.push({ x: ship.x + ship.w / 2, y: ship.y + ship.h / 2, age: 0 });
    // keep recent trail points
    while (shipTrail.length && shipTrail[0].age > 10) shipTrail.shift();
    if (gameOver) return;
    // move ship
    if (left) ship.x -= ship.speed;
    if (right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // spawn
    if (Math.random() < asteroidFreq) spawnAsteroid();
    if (Math.random() < starFreq) spawnStar();

    // move objects
    asteroids.forEach(a => (a.y += asteroidSpeed));
    stars.forEach(s => (s.y += starSpeed));

    // remove off‑screen
    while (asteroids.length && asteroids[0].y > H) asteroids.shift();
    while (stars.length && stars[0].y > H) stars.shift();

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
if (rectsCollide(ship, asteroids[i])) {
          playCrashSound();
          gameOver = true;
          break;
        }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
if (rectsCollide(ship, stars[i])) {
          playStarSound();
          timer += 2; // add 2 seconds per star
          stars.splice(i, 1);
        }
    }

    // timer countdown
    timer -= dt / 1000;
    if (timer <= 0) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient and twinkling stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0d0d2b');
    bgGrad.addColorStop(1, '#1a1a33');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // draw small background stars
    if (!window._bgStars) {
      window._bgStars = [];
      for (let i = 0; i < 150; i++) {
        window._bgStars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5, tw: Math.random() });
      }
    }
    ctx.fillStyle = '#fff';
    window._bgStars.forEach(s => {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s.tw + performance.now() / 1000);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ship trail (glowing)
    ctx.save();
    shipTrail.forEach(t => {
      const alpha = Math.max(0, 0.6 - t.age * 0.05);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 8 - t.age, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // asteroids with radial shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // stars (collectibles) with glow
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(
        s.x + s.w / 2,
        s.y + s.h / 2,
        0,
        s.x + s.w / 2,
        s.y + s.h / 2,
        s.w
      );
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(0.6, '#ff0');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + s.w / 2, s.y + s.h / 2, s.w, 0, Math.PI * 2);
      ctx.fill();
    });

    // timer display
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${Math.max(0, timer).toFixed(1)}`, 10, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
