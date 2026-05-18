// Simple Meteor Dodge game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;
  // Generate simple starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playShoot() { playTone(800, 0.05); }
  function playExplosion() { playTone(200, 0.2); }
  function playGameOver() { playTone(100, 0.5); }

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    health: 3,
  };

  const bullets = [];
  const meteors = [];
  let score = 0;
  let lastMeteor = 0;
  const meteorInterval = 1000; // ms
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
    });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] && ship.x > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w < canvas.width) ship.x += ship.speed;
    // Shoot
    if (keys['Space']) {
      // simple fire rate limit
if (!ship.lastShot || Date.now() - ship.lastShot > 250) {
          bullets.push({ x: ship.x + ship.w / 2, y: ship.y, w: 4, h: 10, speed: 7 });
          ship.lastShot = Date.now();
          playShoot();
        }
    }
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }
    // Spawn meteors
    if (Date.now() - lastMeteor > meteorInterval) {
      spawnMeteor();
      lastMeteor = Date.now();
    }
    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (m.y > canvas.height) {
        meteors.splice(i, 1);
        continue;
      }
      // Bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.x < m.x + m.w && b.x + b.w > m.x && b.y < m.y + m.h && b.y + b.h > m.y) {
          bullets.splice(j, 1);
          meteors.splice(i, 1);
          score += 10;
          playExplosion();
          break;
        }
      }
    }
    // Ship collision
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (ship.x < m.x + m.w && ship.x + ship.w > m.x && ship.y < m.y + m.h && ship.y + ship.h > m.y) {
        meteors.splice(i, 1);
ship.health -= 1;
          if (ship.health <= 0) {
            gameOver = true;
            playGameOver();
          }
      }
    }
  }

function draw() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001d3d');
    gradient.addColorStop(1, '#000814');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship (triangle already defined in edit)
    // Draw bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    // Draw meteors with radial gradient
    meteors.forEach(m => {
      const radGrad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      radGrad.addColorStop(0, '#ff8a80');
      radGrad.addColorStop(1, '#b71c1c');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${ship.health}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
