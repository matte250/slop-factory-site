// Simple Sky Diver game based on IDEA.md
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playToggle = () => beep(600, 0.1);
  const playCollect = () => beep(800, 0.07);
  const playCrash = () => beep(200, 0.3);
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game objects -----
  const player = {
    x: width / 2,
    y: 50,
    radius: 15,
    vx: 0,
    vy: 0,
    parachuteOpen: false,
    color: '#ff6600',
  };

  const balloons = [];
  const obstacles = [];
  let score = 0;
  let gameOver = false;

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCollide = (cx, cy, r, ox, oy, ow, oh) => {
    const dx = Math.max(ox - cx, 0, cx - (ox + ow));
    const dy = Math.max(oy - cy, 0, cy - (oy + oh));
    return dx * dx + dy * dy <= r * r;
  };

  // ----- Input -----
  canvas.addEventListener('click', () => {
    player.parachuteOpen = !player.parachuteOpen;
    playToggle();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') player.vx = -2;
    if (e.code === 'ArrowRight') player.vx = 2;
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') player.vx = 0;
  });

  // ----- Spawn -----
  const spawnBalloon = () => {
    balloons.push({
      x: rand(20, width - 20),
      y: -20,
      radius: 10,
      speed: rand(0.5, 1.5),
    });
  };
  const spawnObstacle = () => {
    const w = rand(30, 60);
    const h = rand(20, 40);
    const type = Math.random() < 0.5 ? 'bird' : 'cloud';
    obstacles.push({
      x: rand(0, width - w),
      y: -h,
      w,
      h,
      speed: rand(1, 3),
      type,
    });
  };
  setInterval(spawnBalloon, 2000);
  setInterval(spawnObstacle, 3000);

  // ----- Main loop -----
  const update = () => {
    if (gameOver) return;
    // gravity & parachute effect
    const gravity = player.parachuteOpen ? 0.3 : 0.8;
    player.vy = Math.min(player.vy + gravity, player.parachuteOpen ? 4 : 10);
    player.x += player.vx;
    player.y += player.vy;

    // bounds
    if (player.x < player.radius) player.x = player.radius;
    if (player.x > width - player.radius) player.x = width - player.radius;

    // balloons
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      b.y += b.speed;
      if (b.y - b.radius > height) balloons.splice(i, 1);
      else if (Math.hypot(b.x - player.x, b.y - player.y) < b.radius + player.radius) {
        score++;
        balloons.splice(i, 1);
      }
    }

    // obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.h > height) obstacles.splice(i, 1);
      else if (rectCollide(player.x, player.y, player.radius, o.x, o.y, o.w, o.h)) {
        gameOver = true;
      }
    }

    // ground collision when parachute closed and fast
    if (player.y + player.radius >= height) {
      if (!player.parachuteOpen && player.vy > 6) gameOver = true;
      else {
        // safe landing – reset position
        player.y = height - player.radius;
        player.vy = 0;
      }
    }

    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    // sky gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#87CEEB'); // light blue
    grad.addColorStop(1, '#1E90FF'); // deeper blue
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // player – draw body and parachute with nicer style
    // body
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // parachute
    if (player.parachuteOpen) {
      // canopy (semi‑ellipse)
      ctx.fillStyle = 'rgba(135,206,250,0.7)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y - 40, player.radius * 2, player.radius, 0, 0, Math.PI, true);
      ctx.fill();
      // cords
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x - player.radius, player.y - player.radius);
      ctx.lineTo(player.x, player.y - 40);
      ctx.lineTo(player.x + player.radius, player.y - player.radius);
      ctx.stroke();
    }

    // balloons – bright circles with a string
    balloons.forEach(b => {
      // balloon body
      const gradB = ctx.createRadialGradient(b.x, b.y, b.radius * 0.2, b.x, b.y, b.radius);
      gradB.addColorStop(0, '#ff8');
      gradB.addColorStop(1, '#f80');
      ctx.fillStyle = gradB;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      // string
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.radius);
      ctx.lineTo(b.x, b.y + b.radius + 10);
      ctx.stroke();
    });

    // obstacles – draw birds and clouds differently
    obstacles.forEach(o => {
      if (o.type === 'bird') {
        // simple bird shape – triangle with wing lines
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h / 2);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h / 2);
        ctx.closePath();
        ctx.fill();
        // wings
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(o.x + o.w * 0.3, o.y + o.h / 2);
        ctx.lineTo(o.x + o.w * 0.5, o.y + o.h * 0.1);
        ctx.moveTo(o.x + o.w * 0.7, o.y + o.h / 2);
        ctx.lineTo(o.x + o.w * 0.5, o.y + o.h * 0.1);
        ctx.stroke();
      } else {
        // cloud – series of overlapping circles
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const r = Math.min(o.w, o.h) / 2;
        ctx.beginPath();
        ctx.arc(cx - r * 0.6, cy, r * 0.8, 0, Math.PI * 2);
        ctx.arc(cx, cy - r * 0.3, r, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.6, cy, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  // start
  requestAnimationFrame(update);
})();
