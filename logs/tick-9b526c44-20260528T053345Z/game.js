// Simple Space Miner game with enhanced graphics and sounds
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Sound wrappers
  function thrustSound() { playTone(200, 0.05); }
  function laserSound() { playTone(600, 0.08); }
  function hitSound() { playTone(100, 0.2); }
  function gameOverSound() { playTone(50, 0.5); }


  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 15,
    fuel: 100,
    hull: 100,
    thrustPower: 0.1,
    rotateSpeed: 0.07,
    laserCooldown: 0,
    laserRate: 15 // frames between shots
  };

  let gameOverPlayed = false; // ensure game over sound plays once

  // Asteroids (drifting)
  const asteroids = [];
  const asteroidCount = 8;
  for (let i = 0; i < asteroidCount; i++) {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: size,
      mined: false
    });
  }

  // Starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5
    });
  }

  // Laser shots
  const lasers = [];

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function update() {
    // Ship controls
    if (ship.fuel > 0) {
      if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
      if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
      if (keys['ArrowUp']) {
        ship.vx += Math.cos(ship.angle) * ship.thrustPower;
        ship.vy += Math.sin(ship.angle) * ship.thrustPower;
        ship.fuel = Math.max(0, ship.fuel - 0.1);
        thrustSound();
      }
    }
    // Laser fire (Space)
    if (keys['Space'] && ship.laserCooldown === 0) {
      lasers.push({
        x: ship.x,
        y: ship.y,
        angle: ship.angle,
        ttl: 30
      });
      ship.laserCooldown = ship.laserRate;
      laserSound();
    }
    if (ship.laserCooldown > 0) ship.laserCooldown--;

    // Update ship position
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap around edges
    if (ship.x < 0) ship.x += width; else if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height; else if (ship.y > height) ship.y -= height;

    // Update asteroids
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0) a.x += width; else if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height; else if (a.y > height) a.y -= height;
    });

    // Update lasers and check collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += Math.cos(l.angle) * 5;
      l.y += Math.sin(l.angle) * 5;
      l.ttl--;
      if (l.ttl <= 0) { lasers.splice(i, 1); continue; }
      // Collision with asteroid
      for (const a of asteroids) {
        if (!a.mined) {
          const dx = l.x - a.x;
          const dy = l.y - a.y;
          if (Math.hypot(dx, dy) < a.radius) {
            a.mined = true; // give points (not tracked)
            lasers.splice(i, 1);
            hitSound(); // play hit sound on mining
            break;
          }
        }
      }
    }

    // Collision ship-asteroid damages hull
    asteroids.forEach(a => {
      if (a.mined) return;
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
if (Math.hypot(dx, dy) < ship.radius + a.radius) {
          ship.hull = Math.max(0, ship.hull - 0.5);
          hitSound(); // play sound on ship collision
        }
    });
  }

  function draw() {
    // Background: black with starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw asteroids with shading gradient
    asteroids.forEach(a => {
      if (a.mined) return; // skip mined
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    // Thrust flame when accelerating
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      const flameGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
      flameGrad.addColorStop(0, 'orange');
      flameGrad.addColorStop(1, 'red');
      ctx.fillStyle = flameGrad;
      ctx.fill();
    }
    ctx.restore();

    // Draw lasers with glow
    ctx.strokeStyle = '#f44';
    ctx.lineWidth = 2;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - Math.cos(l.angle) * 5, l.y - Math.sin(l.angle) * 5);
      ctx.stroke();
    });

    // UI: fuel and hull
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 20);
    ctx.fillText(`Hull: ${ship.hull.toFixed(0)}`, 10, 40);
if (ship.fuel <= 0 || ship.hull <= 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.font = '30px sans-serif';
          ctx.fillText('Game Over', width / 2, height / 2);
          if (!gameOverPlayed) {
            gameOverSound();
            gameOverPlayed = true;
          }
        }
  }

  function loop() {
    if (ship.fuel > 0 && ship.hull > 0) update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
