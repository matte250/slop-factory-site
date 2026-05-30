// Simple Space Junk Collector game
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.width || 800;
  const H = canvas.height = canvas.height || 600;

  // Game settings
  const shipWidth = 40;
  // Sound manager
  let audioCtx = null;
  const getAudioCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  };
  const playTone = (freq, duration) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };
  const playShoot = () => playTone(400, 0.1);
  const playCapture = () => playTone(600, 0.1);
  const playExplosion = () => playTone(200, 0.3);
  const playGameOver = () => playTone(150, 0.5);
  const shipHeight = 20;
  const hookWidth = 4;
  const hookSpeed = 6;
  const debrisSpeed = 2;
  const spawnInterval = 1000; // ms
  const gameDuration = 60; // seconds

  let left = false, right = false, fire = false;
  let score = 0;
  let timeLeft = gameDuration;
  let lastSpawn = 0;
  let lastTimerTick = performance.now();
  let gameOver = false;

  const ship = {
    x: W / 2 - shipWidth / 2,
    y: H - shipHeight - 5,
    w: shipWidth,
    h: shipHeight,
    speed: 5,
  };

  const hook = {
    active: false,
    extending: false,
    x: 0,
    y: 0,
    length: 0,
    maxLen: H / 2,
  };

  const debris = [];

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
    if (e.key === ' ') fire = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
    if (e.key === ' ') fire = false;
  });

  function spawnDebris() {
    const size = Math.random() * 20 + 10;
    const isDanger = Math.random() < 0.2; // asteroid
    debris.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: debrisSpeed + Math.random(),
      danger: isDanger,
      captured: false,
    });
  }

  function update(dt) {
    if (gameOver) return;

    // Move ship
    if (left) ship.x -= ship.speed;
    if (right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // Hook logic
    if (fire && !hook.active) {
      hook.active = true;
      hook.extending = true;
      hook.x = ship.x + ship.w / 2 - hookWidth / 2;
      hook.y = ship.y;
      hook.length = 0;
      playShoot();
    }
    if (hook.active) {
      if (hook.extending) {
        hook.length += hookSpeed;
        if (hook.length >= hook.maxLen) hook.extending = false;
      } else {
        hook.length -= hookSpeed;
        if (hook.length <= 0) hook.active = false;
      }
      // Collision with debris while extending
      if (hook.extending) {
        const tipX = hook.x + hookWidth / 2;
        const tipY = hook.y - hook.length;
        debris.forEach(d => {
          if (!d.captured && tipX > d.x && tipX < d.x + d.w && tipY > d.y && tipY < d.y + d.h) {
            d.captured = true;
            score += d.danger ? 0 : 10; // danger gives no points
            if (!d.danger) playCapture();
          }
        });
      }
    }

    // Update debris
    debris.forEach(d => {
      if (!d.captured) d.y += d.speed;
    });
    // Remove off‑screen or captured debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      if (d.captured) {
        // simple retract effect: nothing to do
        debris.splice(i, 1);
        continue;
      }
if (d.y > H) {
          // lost debris – end game
          gameOver = true;
          playExplosion();
        }
        // collision with ship (danger only)
        if (d.danger &&
            d.x < ship.x + ship.w && d.x + d.w > ship.x &&
            d.y < ship.y + ship.h && d.y + d.h > ship.y) {
          gameOver = true;
          playExplosion();
        }
    }

    // Spawn new debris
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // Timer
    const now = performance.now();
    if (now - lastTimerTick >= 1000) {
      timeLeft--;
      lastTimerTick = now;
      if (timeLeft <= 0) { gameOver = true; playGameOver(); }
    }
  }

function draw() {
  // Background: dark space with starfield
  ctx.fillStyle = '#001020';
  ctx.fillRect(0, 0, W, H);
  drawStars();

  // Ship (triangle with slight gradient)
  const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
  shipGrad.addColorStop(0, '#00aaff');
  shipGrad.addColorStop(1, '#004466');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // Hook (white line with circular tip)
  if (hook.active) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = hookWidth;
    ctx.beginPath();
    ctx.moveTo(hook.x + hookWidth / 2, hook.y);
    ctx.lineTo(hook.x + hookWidth / 2, hook.y - hook.length);
    ctx.stroke();
    // tip circle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hook.x + hookWidth / 2, hook.y - hook.length, hookWidth * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Debris: junk as gray rectangles, asteroids as red polygons
  debris.forEach(d => {
    if (d.danger) {
      // draw asteroid as rough polygon
      ctx.fillStyle = '#b33';
      ctx.beginPath();
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      const points = 7;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = d.w / 2 * (0.7 + Math.random() * 0.6);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#888';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    }
  });

  // UI overlay
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Time: ${timeLeft}`, W - 100, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', W / 2, H / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 20);
  }
}

// Starfield helper (simple static stars)
const stars = [];
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
}
function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Initialize stars once
initStars();

    // Debris
    debris.forEach(d => {
      ctx.fillStyle = d.danger ? '#f44' : '#aaa';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${timeLeft}`, W - 100, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
