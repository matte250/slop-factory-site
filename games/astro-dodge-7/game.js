// Astro Dodge game implementation targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Player ship
  const ship = { x: 80, y: height / 2, w: 30, h: 20, speed: 4 };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };

  // Game objects
  const asteroids = [];
  const orbs = [];
  let fuel = 100;
  let score = 0;
  let distance = 0;
  let lastAsteroid = 0;
  let lastOrb = 0;
  const maxFuel = 100;

  // Input handling
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
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
  // simple background hum
  function startMusic() {
    // play a low drone every 2 seconds
    setInterval(() => playTone(80, 0.5), 2000);
  }
  // start music after user interaction (required by browsers)
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startMusic();
  }, { once: true });
  const setKey = (e, value) => {
    if (e.key in keys) keys[e.key] = value;
    // support WASD
    if (e.key === 'w') keys.ArrowUp = value;
    if (e.key === 'a') keys.ArrowLeft = value;
    if (e.key === 's') keys.ArrowDown = value;
    if (e.key === 'd') keys.ArrowRight = value;
  };
  window.addEventListener('keydown', e => setKey(e, true));
  window.addEventListener('keyup', e => setKey(e, false));

  // Utility helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectIntersect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Game loop
  function update(dt) {
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // clamp
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn asteroids
    if (performance.now() - lastAsteroid > 800) {
      asteroids.push({ x: width, y: rand(0, height - 40), w: 40, h: 40, speed: rand(2, 5) });
      lastAsteroid = performance.now();
    }
    // Spawn orbs
    if (performance.now() - lastOrb > 1500) {
      orbs.push({ x: width, y: rand(0, height - 20), w: 20, h: 20, speed: rand(2, 4) });
      lastOrb = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      else if (rectIntersect(ship, a)) {
        playTone(200, 0.3); // collision sound
        endGame();
        return;
      }
    }
    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) orbs.splice(i, 1);
      else if (rectIntersect(ship, o)) {
        fuel = Math.min(maxFuel, fuel + 10);
        score += 5;
        orbs.splice(i, 1);
        playTone(600, 0.1); // orb collect sound
      }
    }

    // Fuel consumption and distance
    fuel -= dt * 0.01; // drain per ms
    distance += dt * 0.05;
    if (fuel <= 0) {
      endGame();
      return;
    }
    score = Math.floor(distance / 10) + Math.floor(score);
  }

  function drawStarfield() {
    // clear with semi‑transparent overlay for motion blur
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    // moving stars for parallax effect
    if (!window._stars) {
      window._stars = [];
      for (let i = 0; i < 150; i++) {
        window._stars.push({ x: rand(0, width), y: rand(0, height), speed: rand(0.2, 1) });
      }
    }
    ctx.fillStyle = '#fff';
    window._stars.forEach(st => {
      st.x -= st.speed;
      if (st.x < 0) {
        st.x = width;
        st.y = rand(0, height);
        st.speed = rand(0.2, 1);
      }
      ctx.fillRect(st.x, st.y, 2, 2);
    });
  }

  function draw() {
    drawStarfield();
    // ship (triangle) with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (glowing circles)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.1, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, 'rgba(255, 80, 80, 0.9)');
      grad.addColorStop(1, 'rgba(150, 0, 0, 0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // orbs (glowing orbs)
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w*0.1, o.x + o.w/2, o.y + o.h/2, o.w/2);
      grad.addColorStop(0, 'rgba(255, 255, 120, 0.9)');
      grad.addColorStop(1, 'rgba(255, 200, 0, 0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // HUD (neon style)
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, fuel).toFixed(0)}%`, 10, 40);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  let gameOver = false;
  function endGame() {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
  }

  // start loop
  requestAnimationFrame(loop);
})();
