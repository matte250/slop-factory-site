// Minimal Orbit Defender game
// Canvas with id="game"
(function(){
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type='sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    shoot: () => playTone(600, 0.05),
    explosion: () => playTone(200, 0.2, 'triangle'),
    hit: () => playTone(100, 0.3, 'sawtooth'),
    gameOver: () => { for(let i=0;i<3;i++) playTone(150,0.2,i*0.2); }
  };
  // Continue original code
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game objects
  const planet = {x: width/2, y: height/2, radius: 40, health: 10};
  const ship = {angle: 0, radius: 80, size: 10, cooldown: 0};
  const asteroids = [];
  const bullets = [];
  const stars = [];
  let score = 0;
  let lastTime = 0;
  // create background stars
  (function initStars() {
    const count = 100;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
      });
    }
  })();

  // Helper functions
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnAsteroid() {
    const angle = rand(0, Math.PI * 2);
    const r = Math.max(width, height);
    const x = planet.x + Math.cos(angle) * r;
    const y = planet.y + Math.sin(angle) * r;
    const speed = rand(0.5, 1.5);
    asteroids.push({x, y, angle, speed, radius: 12});
  }

  function update(dt) {
    // ship rotation (left/right arrow)
    if (keys['ArrowLeft']) ship.angle -= dt * 0.002;
    if (keys['ArrowRight']) ship.angle += dt * 0.002;
    // fire (space)
    if (keys[' '] && ship.cooldown <= 0) {
      const bx = planet.x + Math.cos(ship.angle) * ship.radius;
      const by = planet.y + Math.sin(ship.angle) * ship.radius;
      bullets.push({x: bx, y: by, angle: ship.angle, speed: 4});
      ship.cooldown = 200; // ms
      sounds.shoot();
    }
    ship.cooldown -= dt;

    // move bullets
    bullets.forEach(b => {
      b.x += Math.cos(b.angle) * b.speed * dt;
      b.y += Math.sin(b.angle) * b.speed * dt;
    });
    // remove off‑screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) bullets.splice(i, 1);
    }

    // move asteroids toward planet
    asteroids.forEach(a => {
      const dx = planet.x - a.x;
      const dy = planet.y - a.y;
      const ang = Math.atan2(dy, dx);
      a.x += Math.cos(ang) * a.speed * dt;
      a.y += Math.sin(ang) * a.speed * dt;
    });

    // collision bullet‑asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (dist(a, b) < a.radius) {
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          sounds.explosion();
          break;
        }
      }
    }

    // asteroid‑planet
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
if (dist(a, planet) < a.radius + planet.radius) {
          asteroids.splice(i, 1);
          planet.health--;
          sounds.hit();
          if (planet.health <= 0) {
            // game over – stop loop
            cancelAnimationFrame(animId);
            sounds.gameOver();
            alert('Game Over! Score: ' + score);
          }
        }
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x - planet.radius / 3,
      planet.y - planet.radius / 3,
      planet.radius / 8,
      planet.x,
      planet.y,
      planet.radius
    );
    planetGrad.addColorStop(0, '#4caf50');
    planetGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();
    // Ship – white triangle with outline
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    const tipX = sx + Math.cos(ship.angle) * ship.size * 1.5;
    const tipY = sy + Math.sin(ship.angle) * ship.size * 1.5;
    const leftX = sx + Math.cos(ship.angle + Math.PI * 0.75) * ship.size;
    const leftY = sy + Math.sin(ship.angle + Math.PI * 0.75) * ship.size;
    const rightX = sx + Math.cos(ship.angle - Math.PI * 0.75) * ship.size;
    const rightY = sy + Math.sin(ship.angle - Math.PI * 0.75) * ship.size;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Bullets with glow
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset
    // Asteroids with rocky gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x - a.radius / 3,
        a.y - a.radius / 3,
        a.radius / 5,
        a.x,
        a.y,
        a.radius
      );
      grad.addColorStop(0, '#b8860b');
      grad.addColorStop(1, '#5d4037');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Health: ' + planet.health, 10, 40);
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  let animId;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    // spawn asteroids over time
    if (Math.random() < dt * 0.001) spawnAsteroid();
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
