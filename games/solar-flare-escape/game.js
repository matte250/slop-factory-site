// Enhanced endless runner graphics based on IDEA.md
// Targets canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Starfield background
  // Simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 + 1 });
  }
  function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += 0.5; // slow drift downwards
      if (s.y > height) s.y = 0, s.x = Math.random() * width;
    });
  }

  // Player ship (triangle)
  const ship = { x: width / 2, y: height - 70, w: 30, h: 40, speed: 5 };
  function drawShip() {
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
  }

  // Game objects
  const asteroids = [], flares = [], orbs = [];
  let frame = 0, distance = 0, boost = 0, gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawn(arr, type) {
    const size = type === 'flare' ? 60 : type === 'orb' ? 15 : Math.random() * 40 + 20;
    arr.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + boost * 0.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02
    });
  }

  function drawAsteroid(o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.rotate(o.rot);
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(0, 0, o.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    o.rot += o.rotSpeed;
  }

  function drawFlare(o) {
    const grad = ctx.createRadialGradient(
      o.x + o.w / 2, o.y + o.h / 2, 0,
      o.x + o.w / 2, o.y + o.h / 2, o.w / 2
    );
    grad.addColorStop(0, 'rgba(255,100,0,0.8)');
    grad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOrb(o) {
    const grad = ctx.createRadialGradient(
      o.x + o.w / 2, o.y + o.h / 2, 0,
      o.x + o.w / 2, o.y + o.h / 2, o.w / 2
    );
    grad.addColorStop(0, 'rgba(255,255,0,0.9)');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function process(arr, drawFn, onCollide) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const o = arr[i];
      o.y += o.speed + boost;
      drawFn(o);
      // collision detection (simple box)
      if (
        ship.x - ship.w / 2 < o.x + o.w &&
        ship.x + ship.w / 2 > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        onCollide(i);
      } else if (o.y > height) {
        arr.splice(i, 1);
      }
    }
  }

  function update() {
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Spawn objects
    if (frame % 60 === 0) spawn(asteroids, 'asteroid');
    if (frame % 300 === 0) spawn(flares, 'flare');
    if (frame % 180 === 0) spawn(orbs, 'orb');

    // Draw background and entities
    drawStars();
    drawShip();
    process(asteroids, drawAsteroid, () => { playTone(200, 0.2); gameOver = true; });
    process(flares, drawFlare, () => { playTone(300, 0.2); gameOver = true; });
    process(orbs, drawOrb, i => { playTone(600, 0.1); boost = Math.min(5, boost + 1); orbs.splice(i, 1); });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Distance: ${Math.floor(distance)}`, 10, 20);
    ctx.fillText(`Boost: ${boost.toFixed(1)}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
      return;
    }

    distance += 0.5 + boost * 0.2;
    boost = Math.max(0, boost - 0.01);
    frame++;
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
})();
