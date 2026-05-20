// Game based on IDEA.md – Asteroid Dodge
// Canvas with id "game" in the HTML
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // Ship definition
  const ship = {
    x: W / 2,
    y: H / 2,
    angle: 0, // radians, 0 points up
    vx: 0,
    vy: 0,
    radius: 8,
    thrust: 0.1,
    rotateSpeed: 0.07,
  };

  // Asteroid definition
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;

  // Game state
  let startTime = null;
  let gameOver = false;

  // Input handling
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound(){
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound(){
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCollisionSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 0.5 + Math.random() * 0.5; // 0.5‑1.0 px/frame
    const size = 15 + Math.random() * 20; // radius
    switch (edge) {
      case 0: // top
        x = Math.random() * W; y = -size; vx = (Math.random() - 0.5) * speed; vy = speed; break;
      case 1: // right
        x = W + size; y = Math.random() * H; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * W; y = H + size; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
      case 3: // left
        x = -size; y = Math.random() * H; vx = speed; vy = (Math.random() - 0.5) * speed; break;
    }
    asteroids.push({x, y, vx, vy, radius: size, angle: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.02});
  }

  function update(dt) {
    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    // Thrust
    if (keys['ArrowUp']) {
      ship.vx += Math.sin(ship.angle) * ship.thrust;
      ship.vy -= Math.cos(ship.angle) * ship.thrust;
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap ship around edges
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;

    // Update asteroids (position and rotation)
    for (let a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rotSpeed;
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.radius || a.x > W + a.radius || a.y < -a.radius || a.y > H + a.radius) {
        asteroids.splice(i, 1);
      }
    }

    // Collision detection (circle‑circle approximation)
    for (let a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const distSq = dx * dx + dy * dy;
      const radSum = a.radius + ship.radius;
      if (distSq < radSum * radSum) {
        gameOver = true;
        playCollisionSound();
        break;
      }
    }
  }

  function draw() {
  // Starfield background (static)
  if (!window._stars) {
    const starCount = 100;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
    window._stars = stars;
  }
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'white';
  for (const s of window._stars) {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

    // Background already rendered above
    // Draw ship with gradient and outline
    ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      // Thruster flame when thrusting
      if (keys['ArrowUp']) {
        ctx.beginPath();
        ctx.moveTo(0, ship.radius + 4);
        ctx.lineTo(ship.radius * 0.5, ship.radius + 12);
        ctx.lineTo(-ship.radius * 0.5, ship.radius + 12);
        ctx.closePath();
        const flameGrad = ctx.createRadialGradient(0, ship.radius + 6, 2, 0, ship.radius + 6, 6);
        flameGrad.addColorStop(0, '#ff0');
        flameGrad.addColorStop(1, '#f80');
        ctx.fillStyle = flameGrad;
        ctx.fill();
      }
      // Ship shape
      ctx.beginPath();
      ctx.moveTo(0, -ship.radius);
      ctx.lineTo(ship.radius, ship.radius);
      ctx.lineTo(-ship.radius, ship.radius);
      ctx.closePath();
      // Ship gradient fill with glow
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur = 8;
      const shipGrad = ctx.createRadialGradient(0, 0, ship.radius * 0.2, 0, 0, ship.radius);
      shipGrad.addColorStop(0, '#0f0');
      shipGrad.addColorStop(1, '#003300');
      ctx.fillStyle = shipGrad;
      ctx.fill();
      // Reset shadow for other drawings
      ctx.shadowBlur = 0;
      // Ship outline
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#0a0';
      ctx.stroke();
      ctx.restore();

    // Draw asteroids with rotation and gradient
    for (let a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      // Gradient fill for asteroid
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      // Outline
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#777';
      ctx.stroke();
      ctx.restore();
    }

    // Draw score
    const now = Date.now();
    const score = ((now - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}s`, W / 2, H / 2 + 40);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    if (!gameOver) {
      if (timestamp - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
