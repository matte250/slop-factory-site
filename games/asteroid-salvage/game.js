// Simple Asteroid Salvage game (canvas id="game")
(() => {
  // starfield will be initialized after canvas size is known

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // ----- ship -----
  // audio setup
  let audioCtx;
  function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playSound(freq, dur) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }

  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    shield: 3,
  };

  // ----- input -----
  const keys = { ArrowUp: false, ArrowLeft: false, ArrowRight: false };
  addEventListener('keydown', e => {
      if (e.code in keys) keys[e.code] = true;
      if (!audioCtx) initAudio();
      if (e.code === 'ArrowUp' && !keys.ArrowUp) { // start thrust sound
        playSound(200, 0.2);
      }
    });
  addEventListener('keyup', e => { if (e.code in keys) keys[e.code] = false; });

  // ----- objects -----
  const asteroids = [];
  const crates = [];
  let frame = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * (1 + frame / 6000);
    asteroids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 15 + Math.random() * 20,
    });
  }

  function spawnCrate() {
    crates.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 8,
      collected: false,
    });
  }

  function update() {
    // update starfield for parallax effect
    stars.forEach(star => {
      star.x -= ship.vx * 0.05;
      star.y -= ship.vy * 0.05;
      if (star.x < 0) star.x += width;
      else if (star.x > width) star.x -= width;
      if (star.y < 0) star.y += height;
      else if (star.y > height) star.y -= height;
    });
    if (gameOver) return;
    // ship controls
    if (keys.ArrowLeft) ship.angle -= 0.05;
    if (keys.ArrowRight) ship.angle += 0.05;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * 0.1;
      ship.vy += Math.sin(ship.angle) * 0.1;
    }
    // motion
    ship.x += ship.vx; ship.y += ship.vy;
    // wrap
    if (ship.x < 0) ship.x += width; else if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height; else if (ship.y > height) ship.y -= height;
    // friction
    ship.vx *= 0.99; ship.vy *= 0.99;

    // asteroids
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0) a.x += width; else if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height; else if (a.y > height) a.y -= height;
    });
    // crates (static)

    // collisions ship-asteroid
    for (const a of asteroids) {
      const dx = ship.x - a.x, dy = ship.y - a.y;
if (Math.hypot(dx, dy) < ship.radius + a.r) {
          ship.shield--;
          // bounce ship
          ship.vx *= -0.5; ship.vy *= -0.5;
          // collision sound
          if (!audioCtx) initAudio();
          playSound(100, 0.3);
          if (ship.shield <= 0) { gameOver = true; }
          break;
        }
    }
    // collisions ship-crate
    for (const c of crates) {
      if (c.collected) continue;
      const dx = ship.x - c.x, dy = ship.y - c.y;
      if (Math.hypot(dx, dy) < ship.radius + c.r) {
        c.collected = true;
        // could increase score here
      }
    }
    // spawn timing
    if (frame % Math.max(120 - Math.floor(frame / 600), 30) === 0) spawnAsteroid();
    if (frame % 600 === 0) spawnCrate();
    frame++;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship with glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.7)';
    ctx.shadowBlur = ship.shield > 0 ? 10 : 0;
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = ship.shield > 0 ? '#0f0' : '#f00';
    ctx.fill();
    // thrust flame
    if (keys.ArrowUp) {
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-18, -4);
      ctx.lineTo(-18, 4);
      ctx.closePath();
      ctx.fillStyle = '#ff8';
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = ship.shield > 0 ? '#0f0' : '#f00';
    ctx.fill();
    ctx.restore();
    // asteroids with slight shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // crates
    ctx.fillStyle = '#ff0';
    crates.filter(c => !c.collected).forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Shield: ' + ship.shield, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
