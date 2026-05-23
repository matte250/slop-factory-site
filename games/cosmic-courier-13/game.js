// Simple "Cosmic Courier" game targeting canvas with id="game"
// Rocket navigates by thrust (ArrowUp) and rotates (ArrowLeft/Right).
// Planets rotate, parcels appear, oxygen timer limits play.
// Collision with asteroids or oxygen depletion ends the game.

(() => {
  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }

  // handle thrust sound start/stop
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp' && !thrustOsc) {
      thrustOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      thrustOsc.frequency.value = 150;
      thrustOsc.type = 'sawtooth';
      thrustOsc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      thrustOsc.start();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp' && thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  });
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ------- Game objects -------
  // starfield for background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * 0.5 + 0.5,
    });
  }

  const rocket = {
    x: width / 2,
    y: height / 2,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.05,
  };

  const planets = [];
  const asteroids = [];
  let parcel = null;
  let oxygen = 100; // seconds
  let lastTime = null;
  let gameOver = false;

  // create some rotating planets
  for (let i = 0; i < 3; i++) {
    const r = 40 + Math.random() * 30;
    const orbit = 100 + Math.random() * 150;
    const speed = 0.3 + Math.random() * 0.3;
    planets.push({r, orbit, speed, angle: Math.random() * Math.PI * 2});
  }

  // create a few asteroids (static obstacles)
  for (let i = 0; i < 5; i++) {
    const ax = Math.random() * width;
    const ay = Math.random() * height;
    const ar = 15 + Math.random() * 10;
    asteroids.push({x: ax, y: ay, r: ar});
  }

  function spawnParcel() {
    // place near a random planet
    const p = planets[Math.floor(Math.random()*planets.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = p.orbit + p.r + 20;
    const cx = width/2 + Math.cos(p.angle+angle) * distance;
    const cy = height/2 + Math.sin(p.angle+angle) * distance;
    parcel = {x: cx, y: cy, r: 8, delivered: false};
  }
  spawnParcel();

  // -------- Input --------
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);

  // -------- Helpers --------
  function dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.hypot(dx, dy);
  }

  function update(dt) {
    // animate star twinkle
    stars.forEach(s => {
      s.twinkle += (Math.random() - 0.5) * 0.02;
      if (s.twinkle < 0.3) s.twinkle = 0.3;
      if (s.twinkle > 1) s.twinkle = 1;
    });
    if (gameOver) return;
    // oxygen drain
    oxygen -= dt / 1000;
    if (oxygen <= 0) { playTone(200, 400); gameOver = true; return; }

    // control rocket
    if (keys['ArrowLeft']) rocket.angle -= rocket.rotateSpeed;
    if (keys['ArrowRight']) rocket.angle += rocket.rotateSpeed;
    if (keys['ArrowUp']) {
      rocket.vx += Math.cos(rocket.angle) * rocket.thrust;
      rocket.vy += Math.sin(rocket.angle) * rocket.thrust;
    }
    // simple friction
    rocket.vx *= 0.99;
    rocket.vy *= 0.99;
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;

    // wrap around edges
    if (rocket.x < 0) rocket.x += width;
    if (rocket.x > width) rocket.x -= width;
    if (rocket.y < 0) rocket.y += height;
    if (rocket.y > height) rocket.y -= height;

    // rotate planets
    planets.forEach(p => p.angle += p.speed * dt / 1000);

    // check delivery
    if (parcel && !parcel.delivered && dist(rocket.x, rocket.y, parcel.x, parcel.y) < rocket.radius + parcel.r) {
      parcel.delivered = true;
        playTone(400, 200); // delivery sound
      oxygen = Math.min(100, oxygen + 30); // reward oxygen
      setTimeout(spawnParcel, 1000);
    }

    // collisions with asteroids
    for (const a of asteroids) {
      if (dist(rocket.x, rocket.y, a.x, a.y) < rocket.radius + a.r) { playTone(100,300);
        gameOver = true; break;
      }
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,width,height);
    // stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${s.twinkle})`;
      ctx.fill();
    });
    ctx.clearRect(0,0,width,height);
    // draw planets (as circles around canvas centre)
    const cx = width/2, cy = height/2;
    planets.forEach(p => {
      const x = cx + Math.cos(p.angle) * p.orbit;
      const y = cy + Math.sin(p.angle) * p.orbit;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI*2);
      ctx.fillStyle = '#555';
      ctx.fill();
    });
    // draw asteroids
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fillStyle = '#888';
      ctx.fill();
    });
    // draw parcel if exists
    if (parcel && !parcel.delivered) {
      ctx.beginPath();
      ctx.arc(parcel.x, parcel.y, parcel.r, 0, Math.PI*2);
      ctx.fillStyle = '#0f0';
      ctx.fill();
    }
    // draw rocket (triangle)
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angle);
    ctx.beginPath();
    ctx.moveTo(15,0);
    ctx.lineTo(-10,-8);
    ctx.lineTo(-10,8);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Oxygen: ${oxygen.toFixed(1)}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', cx, cy);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
