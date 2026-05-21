// Bouncer Dash – minimal implementation
// Canvas must have id="game"

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  const BALL_RADIUS = 12;
  const GRAVITY = 0.4;
  const BOOST = -8;

  let ball = { x: 60, y: H / 2, vy: 0 };
  let obstacles = [];
  let rings = [];
  let particles = [];
  let score = 0;
  let gameOver = false;
  let lastObs = 0;
  let lastRing = 0;

  // helper functions
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCollides = (rect) => {
    const distX = Math.abs(ball.x - rect.x - rect.w / 2);
    const distY = Math.abs(ball.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + BALL_RADIUS) return false;
    if (distY > rect.h / 2 + BALL_RADIUS) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= BALL_RADIUS * BALL_RADIUS;
  };
  const ringCollides = (ring) => {
    const dx = ball.x - ring.x;
    const dy = ball.y - ring.y;
    const dist = Math.hypot(dx, dy);
    return dist < BALL_RADIUS + ring.r;
  };

  // input
  canvas.addEventListener('click', () => {
    if (gameOver) return restart();
    // ensure audio context is running (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    ball.vy = BOOST;
    // boost sound
    playTone(300, 120);
    // spawn boost particles
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: ball.x,
        y: ball.y,
        vy: rand(-2, -5),
        vx: rand(-1, 1),
        size: rand(2, 4),
        life: 30
      });
    }
  });

  function spawnObstacle() {
    const h = rand(30, 80);
    const w = rand(20, 50);
    const y = rand(0, H - h);
    obstacles.push({ x: W, y, w, h, speed: rand(2, 4) });
  }

  function spawnRing() {
    const r = 15;
    const y = rand(r, H - r);
    rings.push({ x: W, y, r, speed: 2.5, scored: false });
  }

  function restart() {
    ball = { x: 60, y: H / 2, vy: 0 };
    obstacles = [];
    rings = [];
    score = 0;
    gameOver = false;
    lastObs = lastRing = 0;
    requestAnimationFrame(loop);
  }

  function loop(timestamp) {
    if (gameOver) return;
    // clear with background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#1e1e2f");
    bgGrad.addColorStop(1, "#0a0a1a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // physics
    ball.vy += GRAVITY;
    ball.y += ball.vy;
    // floor/ceiling check
    if (ball.y + BALL_RADIUS > H || ball.y - BALL_RADIUS < 0) {
      gameOver = true;
    }

    // obstacles
    if (!lastObs || timestamp - lastObs > 1500) { spawnObstacle(); lastObs = timestamp; }
    obstacles.forEach(o => { o.x -= o.speed; });
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // draw obstacles with rounded corners and subtle shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#444';
    const roundRect = (x,y,w,h,r) => {
      ctx.beginPath();
      ctx.moveTo(x+r, y);
      ctx.lineTo(x+w-r, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+r);
      ctx.lineTo(x+w, y+h-r);
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      ctx.lineTo(x+r, y+h);
      ctx.quadraticCurveTo(x, y+h, x, y+h-r);
      ctx.lineTo(x, y+r);
      ctx.quadraticCurveTo(x, y, x+r, y);
      ctx.closePath();
      ctx.fill();
    };
    obstacles.forEach(o => roundRect(o.x, o.y, o.w, o.h, 4));
    ctx.restore();
    // particles effect
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    particles = particles.filter(p => p.life > 0);
    ctx.save();
    particles.forEach(p => {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // rings
    if (!lastRing || timestamp - lastRing > 2000) { spawnRing(); lastRing = timestamp; }
    rings.forEach(r => { r.x -= r.speed; });
    rings = rings.filter(r => r.x + r.r > 0);
    // draw rings with glow
    rings.forEach(r => {
      const ringGrad = ctx.createRadialGradient(r.x, r.y, r.r * 0.2, r.x, r.y, r.r);
      ringGrad.addColorStop(0, 'rgba(255,255,0,0.8)');
      ringGrad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255,255,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    });
    // reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // detections with sound effects
    for (const o of obstacles) {
      if (rectCollides(o)) {
        gameOver = true;
        // collision sound
        playTone(150, 200);
        break;
      }
    }
    for (const r of rings) {
      if (!r.scored && ringCollides(r)) {
        r.scored = true;
        score++;
        // ring collect sound
        playTone(600, 120);
      }
    }

    // draw ball with gradient
    const ballGrad = ctx.createRadialGradient(ball.x, ball.y, BALL_RADIUS * 0.2, ball.x, ball.y, BALL_RADIUS);
    ballGrad.addColorStop(0, '#0ff');
    ballGrad.addColorStop(1, '#006');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', W / 2, H / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
