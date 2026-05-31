// Minimalist Nebula Escape game
// Canvas with id="game" expected in HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Game objects
  const ship = { x: width / 2, y: height - 40, width: 20, height: 30, speed: 5, shield: false };
  const asteroids = [];
  const stars = []; // precomputed star positions
  // generate static stars for background with slight vertical motion for parallax effect
  (function generateStars(){
    const count = 150;
    for(let i=0;i<count;i++){
      stars.push({
        x: Math.random()*width,
        y: Math.random()*height,
        speed: 0.3 + Math.random()*0.2 // slow drift
      });
    }
  })();
  const powerUps = [];

  let keys = {};
  let frame = 0;
  let speedFactor = 1;
  let shieldTimer = 0;

  // Input handling
  let audioStarted = false;
  function ensureAudio(){
    if (!audioStarted){
      audioCtx.resume();
      audioStarted = true;
    }
  }
  window.addEventListener('keydown', (e) => { keys[e.key] = true; ensureAudio(); if(e.key==='ArrowLeft' || e.key==='ArrowRight'){ playTone(200,0.05); } });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    asteroids.push({ x: Math.random() * (width - radius * 2) + radius, y: -radius, radius, speed: 1.5 * speedFactor });
  }

  function spawnPowerUp() {
    const size = 12;
    powerUps.push({ x: Math.random() * (width - size), y: -size, size, speed: 1.5 * speedFactor });
  }

  function update() {
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // spawn logic
    if (frame % 60 === 0) spawnAsteroid(); // every second at 60fps
    if (frame % 600 === 0) spawnPowerUp(); // occasional power‑up

    // increase speed over time
    if (frame % 1800 === 0) speedFactor += 0.2;

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y - p.size > height) powerUps.splice(i, 1);
    }

    // shield timer
    if (ship.shield) {
      shieldTimer -= 1;
      if (shieldTimer <= 0) ship.shield = false;
    }

    // update stars (parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // simple circle‑rect collision
      const dx = Math.max(ship.x, Math.min(a.x, ship.x + ship.width));
      const dy = Math.max(ship.y, Math.min(a.y, ship.y + ship.height));
      const dist = Math.hypot(a.x - dx, a.y - dy);
      if (dist < a.radius) {
        if (ship.shield) {
          // destroy asteroid when shielded, play sound
          playTone(300, 0.1);
          asteroids.splice(i, 1);
        } else {
          alert('Game Over');
          document.location.reload();
          return;
        }
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
if (p.x < ship.x + ship.width && p.x + p.size > ship.x && p.y < ship.y + ship.height && p.y + p.size > ship.y) {
          ship.shield = true;
          shieldTimer = 300; // 5 seconds at 60fps
          playTone(600, 0.1); // power‑up collection
          powerUps.splice(i, 1);
        }
    }

    frame++;
  }

  function draw() {
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#001020');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    // stars (precomputed)
    ctx.fillStyle = 'white';
    stars.forEach(st => ctx.fillRect(st.x, st.y, 1, 1));
    // ship (triangle)
    ctx.fillStyle = ship.shield ? 'cyan' : 'white';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius*0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // power‑ups
    ctx.fillStyle = 'gold';
    powerUps.forEach(p => {
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
