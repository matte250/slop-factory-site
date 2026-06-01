// Simple Astro Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const startThrustSound = () => {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    gain.gain.value = 0.02;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  };
  const stopThrustSound = () => {
    if (!thrustOsc) return;
    thrustOsc.osc.stop();
    thrustOsc.osc.disconnect();
    thrustOsc.gain.disconnect();
    thrustOsc = null;
  };
  const playCrashSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };
  // ----- Ship -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  document.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      if (e.key === 'ArrowUp') startThrustSound();
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key in keys) {
      keys[e.key] = false;
      if (e.key === 'ArrowUp') stopThrustSound();
    }
  });

  // ----- Asteroids -----
  const asteroids = [];
  const particles = []; // thrust particles
  let spawnCooldown = 0; // frames until next spawn
  let spawnInterval = 120; // start one every 2 seconds at 60fps
  const maxSpeed = 2;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = Math.random() * maxSpeed + 0.5;
    const angle = Math.random() * Math.PI * 2;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    const radius = Math.random() * 15 + 10;
    // generate irregular shape
    const points = [];
    const sides = Math.floor(Math.random() * 4) + 5; // 5-8 sides
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      const offset = (Math.random() * 0.4 + 0.8) * radius; // vary radius per vertex
      points.push({ x: Math.cos(theta) * offset, y: Math.sin(theta) * offset });
    }
    // spawn just outside canvas
    if (edge === 0) { x = -radius; y = Math.random() * canvas.height; }
    else if (edge === 1) { x = canvas.width + radius; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = -radius; }
    else { x = Math.random() * canvas.width; y = canvas.height + radius; }
    asteroids.push({ x, y, vx, vy, radius, points });
  }

  // ----- Game State -----
  let startTime = performance.now();
  let gameOver = false;

  function update(dt) {
    // Ship rotation
    if (keys.ArrowLeft) ship.angle -= 0.07;
    if (keys.ArrowRight) ship.angle += 0.07;
    // Thrust
    if (keys.ArrowUp) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      // generate thrust particles
      for (let i = 0; i < 3; i++) {
        const angle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.4;
        const speed = Math.random() * 1 + 0.5;
        particles.push({
          x: ship.x,
          y: ship.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30,
          maxLife: 30,
        });
      }
    }
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // screen wrap
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Asteroids
    if (spawnCooldown <= 0) {
      spawnAsteroid();
      spawnCooldown = spawnInterval;
      // Ramp difficulty: increase spawn rate, cap at 30 frames
      if (spawnInterval > 30) spawnInterval -= 1;
    } else {
      spawnCooldown--;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.radius) a.x += canvas.width + a.radius * 2;
      if (a.x > canvas.width + a.radius) a.x -= canvas.width + a.radius * 2;
      if (a.y < -a.radius) a.y += canvas.height + a.radius * 2;
      if (a.y > canvas.height + a.radius) a.y -= canvas.height + a.radius * 2;
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
        if (dist < a.radius + ship.radius) {
          gameOver = true;
          playCrashSound();
          break;
        }
    }
  }

  function draw() {
    // Background stars
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#555';
    for (let i = 0; i < 100; i++) {
      const sx = (i * 37) % canvas.width;
      const sy = ((i * 73) % canvas.height);
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Draw ship (triangle with glow)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    // glow
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Draw asteroids with irregular shapes
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    for (const a of asteroids) {
      if (a.points) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let p = 1; p < a.points.length; p++) {
          ctx.lineTo(a.points[p].x, a.points[p].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Thrust particles
    ctx.fillStyle = '#ff0';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    // Score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Survived ${elapsed}s`, canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
