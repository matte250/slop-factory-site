// game.js – simple Asteroid Dodge
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ---- Game state ----
  // Ship object
  let ship = { x: width / 2, y: height - 60, w: 40, h: 40, speed: 5 };
  // Asteroids with rotation
  let asteroids = [];
  // Fuel canisters
  let fuels = [];
  // Fuel percentage
  let fuel = 100; // percent
  let score = 0;
  let gameOver = false;
  const asteroidSpawnRate = 0.02; // per frame
  const fuelSpawnRate = 0.001;
  // Simple moving starfield
  let stars = [];
  const STAR_COUNT = 120;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, speed: 0.5 + Math.random() * 0.5 });
  }

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update() {
    if (gameOver) return;
    // move ship
    if (keys['ArrowLeft'] && ship.x > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w < width) ship.x += ship.speed;
    if (keys['ArrowUp'] && ship.y > 0) ship.y -= ship.speed;
    if (keys['ArrowDown'] && ship.y + ship.h < height) ship.y += ship.speed;

    // spawn asteroids
    if (Math.random() < asteroidSpawnRate) {
      const size = 20 + Math.random() * 30;
      asteroids.push({
        x: Math.random() * (width - size),
        y: -size,
        w: size,
        h: size,
        speed: 2 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }
    // spawn fuel canisters
    if (Math.random() < fuelSpawnRate) {
      const s = 20;
      fuels.push({ x: Math.random() * (width - s), y: -s, w: s, h: s, speed: 2 });
    }

    // move asteroids, rotate them, and fuels
    asteroids.forEach(a => {
      a.y += a.speed;
      a.rotation += a.rotSpeed;
    });
    fuels.forEach(f => f.y += f.speed);
    // update starfield
    stars.forEach(st => {
      st.y += st.speed;
      if (st.y > height) {
        st.y = 0;
        st.x = Math.random() * width;
      }
    });
    // remove off‑screen
    asteroids = asteroids.filter(a => a.y < height);
    fuels = fuels.filter(f => f.y < height);

    // fuel consumption
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;

    // collisions
    for (const a of asteroids) {
      if (rectsIntersect(ship, a)) {
        gameOver = true;
        playTone(150, 0.3); // crash sound
        break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (rectsIntersect(ship, fuels[i])) {
        fuel = Math.min(100, fuel + 30);
        fuels.splice(i, 1);
        score += 10;
        playTone(300, 0.1); // fuel collect sound
      }
    }
    // score based on time
    score += 0.1;
  }


  function rectsIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function draw() {
    // background gradient (night sky)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // moving starfield
    ctx.fillStyle = '#fff';
    stars.forEach(st => ctx.fillRect(st.x, st.y, 2, 2));
    // ship – a white triangle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids – rotating gray rocks
    asteroids.forEach(a => {
      ctx.save();
      const cx = a.x + a.w / 2;
      const cy = a.y + a.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(a.rotation);
      // slight colour variation based on size
      const shade = Math.floor(150 + (a.w / 80) * 105);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // fuel canisters – green squares
    ctx.fillStyle = '#0f0';
    fuels.forEach(f => ctx.fillRect(f.x, f.y, f.w, f.h));
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, fuel).toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
