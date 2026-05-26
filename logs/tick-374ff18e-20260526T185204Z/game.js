// Orbit Runner – simple canvas game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to its CSS size or fallback
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Generate simple starfield background
  const STAR_COUNT = 100;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    radius: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.6 + 0.4,
  }));

  // Trail for satellite (stores last positions)
  const trail = [];
  const TRAIL_MAX = 30;

  // ----- Game constants -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  let lastThrustSound = 0;
  const PLANET_RADIUS = 40;
  const SAT_RADIUS = 8;
  const ASTEROID_RADIUS = 12;
  const GRAVITY = 0.001; // pulls satellite toward planet
  const THRUST = 0.004; // radial thrust per frame when arrow pressed
  const ASTEROID_SPEED = 0.6; // radial speed of asteroids
  const ASTEROID_SPAWN_INTERVAL = 2000; // ms

  // ----- Game state -----
  let satAngle = 0; // radians
  let satRadius = 150; // distance from planet centre
  let satRadialVel = 0; // radial velocity
  const asteroids = [];
  let lastAsteroid = 0;
  let startTime = performance.now();
  let score = 0;
  let running = true;
  let gameOverPlayed = false;

  // ----- Input -----
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
  // also resume on click/touch
  window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });

  // ----- Helper functions -----
  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (Math.min(W, H) / 2 - PLANET_RADIUS - 20) + PLANET_RADIUS + 20;
    const direction = Math.random() < 0.5 ? -1 : 1; // inward or outward
    asteroids.push({ angle, radius, direction });
  }

  function update(dt) {
    // thrust changes radial velocity
    if (keys.ArrowLeft) {
      satRadialVel -= THRUST * dt;
      const now = performance.now();
      if (now - lastThrustSound > 80) { // throttle
        playTone(440, 0.05);
        lastThrustSound = now;
      }
    }
    if (keys.ArrowRight) {
      satRadialVel += THRUST * dt;
      const now = performance.now();
      if (now - lastThrustSound > 80) {
        playTone(660, 0.05);
        lastThrustSound = now;
      }
    }
    // gravity pulls inward
    satRadialVel -= GRAVITY * dt;
    // apply radial velocity
    satRadius += satRadialVel * dt;
    // keep angle moving (simple orbital angular speed based on radius)
    const angularSpeed = 0.001 / Math.max(satRadius, 1);
    satAngle += angularSpeed * dt;
    // planet collision
    if (satRadius <= PLANET_RADIUS + SAT_RADIUS) running = false;
    // asteroid spawn
    if (performance.now() - lastAsteroid > ASTEROID_SPAWN_INTERVAL) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }
    // update asteroids
    for (const a of asteroids) {
      a.radius += a.direction * ASTEROID_SPEED * dt;
    }
    // collision detection
    for (const a of asteroids) {
      const dx = (satRadius * Math.cos(satAngle) - a.radius * Math.cos(a.angle));
      const dy = (satRadius * Math.sin(satAngle) - a.radius * Math.sin(a.angle));
      if (Math.hypot(dx, dy) < SAT_RADIUS + ASTEROID_RADIUS) {
        running = false;
        break;
      }
    }
    // remove off‑screen asteroids
    asteroids.splice(0, asteroids.length, ...asteroids.filter(a => a.radius > PLANET_RADIUS && a.radius < Math.min(W, H) / 2));
    // score
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

function draw() {
    // background black with starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with radial gradient (already set in init)
    const planetGrad = ctx.createRadialGradient(W / 2, H / 2, PLANET_RADIUS * 0.3, W / 2, H / 2, PLANET_RADIUS);
    planetGrad.addColorStop(0, '#9c7fb6');
    planetGrad.addColorStop(1, '#3b2c4f');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // satellite position
    const satX = W / 2 + satRadius * Math.cos(satAngle);
    const satY = H / 2 + satRadius * Math.sin(satAngle);
    // add to trail
    trail.push({x: satX, y: satY});
    if (trail.length > TRAIL_MAX) trail.shift();
    // draw trail (fading)
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const alpha = i / trail.length;
      ctx.fillStyle = `rgba(255,221,87,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, SAT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
    // satellite glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffdd57';
    ctx.fillStyle = '#ffdd57';
    ctx.beginPath();
    ctx.arc(satX, satY, SAT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // asteroids with subtle gradient
    for (const a of asteroids) {
      const x = W / 2 + a.radius * Math.cos(a.angle);
      const y = H / 2 + a.radius * Math.sin(a.angle);
      const grad = ctx.createRadialGradient(x, y, ASTEROID_RADIUS * 0.2, x, y, ASTEROID_RADIUS);
      grad.addColorStop(0, '#b0b0b0');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, ASTEROID_RADIUS, 0, Math.PI * 2);
      ctx.fill();
 
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  function loop(timestamp) {
    if (!running) {
      if (!gameOverPlayed) {
        playTone(220, 0.6);
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
      ctx.fillText(`Final Score: ${score}s`, W / 2 - 70, H / 2 + 30);
      return;
    }
    const dt = timestamp - (lastRender || timestamp);
    lastRender = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastRender = 0;
  requestAnimationFrame(loop);
})();
