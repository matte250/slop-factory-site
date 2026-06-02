// Solar Flare Escape – minimal canvas game
// Canvas id: "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  document.addEventListener('keydown', resumeAudio, {once: true});
  function playTone(freq, type='sine', dur=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Simple ambient background hum
  const startAmbient = () => {
    setInterval(() => {
      // low rumble
      playTone(80, 'sine', 0.3);
    }, 3000);
  };
  // Start ambient after first interaction
  document.addEventListener('keydown', startAmbient, {once: true});

  // Game state
  let ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 4, shield: false };
  const keys = {};
  let asteroids = [];
  let flares = [];
  let powerUps = [];
  let score = 0;
  let distance = 0;
  let gameOver = false;

  // Input handling
  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }
  function spawnFlare() {
    const size = 40;
    flares.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 1.5 });
  }
  function spawnPowerUp() {
    const type = Math.random() < 0.5 ? 'speed' : 'shield';
    powerUps.push({ x: Math.random() * (width - 20), y: -20, w: 20, h: 20, speed: 2, type });
  }

  let asteroidTimer = 0, flareTimer = 0, powerTimer = 0;

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
    if (keys.ArrowRight && ship.x + ship.w < width) ship.x += ship.speed;
    if (keys.ArrowUp && ship.y > 0) ship.y -= ship.speed;
    if (keys.ArrowDown && ship.y + ship.h < height) ship.y += ship.speed;

    // Update objects
    const move = (arr) => arr.forEach(o => o.y += o.speed);
    move(asteroids);
    move(flares);
    move(powerUps);

    // Remove off‑screen
    const clean = (arr) => arr.filter(o => o.y < height + o.h);
    asteroids = clean(asteroids);
    flares = clean(flares);
    powerUps = clean(powerUps);

    // Collisions
    const rectCollide = (a, b) => !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (rectCollide(ship, asteroids[i])) {
        if (ship.shield) { asteroids.splice(i, 1); ship.shield = false; }
        else { playTone(200, 'sawtooth', 0.3); gameOver = true; }
      }
    }
    for (let i = flares.length - 1; i >= 0; i--) {
      if (rectCollide(ship, flares[i])) {
        if (ship.shield) { flares.splice(i, 1); ship.shield = false; }
        else { playTone(250, 'sawtooth', 0.3); gameOver = true; }
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (rectCollide(ship, powerUps[i])) {
        if (powerUps[i].type === 'speed') {
        ship.speed += 2;
        playTone(400, 'triangle', 0.1);
      }
      if (powerUps[i].type === 'shield') {
        ship.shield = true;
        playTone(600, 'square', 0.15);
      }
      powerUps.splice(i, 1);
    }
    }

    // Spawn logic
    if (asteroidTimer++ > 60) { spawnAsteroid(); asteroidTimer = 0; }
    if (flareTimer++ > 300) { spawnFlare(); flareTimer = 0; }
    if (powerTimer++ > 400) { spawnPowerUp(); powerTimer = 0; }

    // Scoring
    distance += 0.5;
    score = Math.floor(distance);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background with moving stars
    // Initialize starfield if not already
    if (!window.stars) {
      window.stars = [];
      for (let i = 0; i < 100; i++) {
        window.stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
      }
    }
    // Update and draw stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    window.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // Ship with shield glow
    const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGradient.addColorStop(0, ship.shield ? '#0ff' : '#0f0');
    shipGradient.addColorStop(1, ship.shield ? '#003' : '#020');
    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // optional outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.2, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Flares with pulsating glow
    flares.forEach(f => {
      const grad = ctx.createRadialGradient(f.x + f.w/2, f.y + f.h/2, f.w*0.1, f.x + f.w/2, f.y + f.h/2, f.w/2);
      grad.addColorStop(0, 'rgba(255,140,0,0.8)');
      grad.addColorStop(1, 'rgba(255,70,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.w/2, f.y + f.h/2, f.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Power‑ups with distinct icons
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(p.x + p.w/2, p.y + p.h/2, p.w*0.1, p.x + p.w/2, p.y + p.h/2, p.w/2);
      if (p.type === 'speed') {
        grad.addColorStop(0, '#0f0');
        grad.addColorStop(1, '#060');
      } else { // shield
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#660');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + p.w/2, p.y + p.h/2, p.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start
  loop();
})();
