// Simple endless runner based on IDEA.md
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // ----- Audio setup -----
  // Simple synth beep generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Background ambient sound (looped)
  const bgAudio = new Audio('https://cdn.jsdelivr.net/gh/johnsmith1001/space-sounds@main/ambient.mp3');
  bgAudio.loop = true;
  bgAudio.volume = 0.2;
  // Collision / crash sound
  const crashAudio = new Audio('https://cdn.jsdelivr.net/gh/johnsmith1001/space-sounds@main/crash.mp3');
  crashAudio.volume = 0.4;
  // Start after a user interaction (required by browsers)
  const startAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    bgAudio.play();
    window.removeEventListener('keydown', startAudio);
    window.removeEventListener('click', startAudio);
  };
  window.addEventListener('keydown', startAudio);
  window.addEventListener('click', startAudio);

  // ----- Ship -----
  const ship = {
    x: W / 2,
    y: H * 0.8,
    r: 15,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
  };

  // ----- Starfield -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + 1 });
  }
  function updateStars() {
    for (const s of stars) {
      s.y += 1.5; // speed of forward motion
      if (s.y > H) {
        s.x = Math.random() * W;
        s.y = 0;
        s.size = Math.random() * 2 + 1;
      }
    }
  }
  function drawStars() {
    // draw glowing stars as circles
    for (const s of stars) {
      const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
      gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ----- Obstacles -----
  const obstacles = [];
  const OBSTACLE_FREQ = 120; // frames
  let frameCount = 0;
  function spawnObstacle() {
    const radius = 15 + Math.random() * 20;
    const x = Math.random() * (W - radius * 2) + radius;
    obstacles.push({ x, y: -radius, r: radius, speed: 2 + Math.random() * 2 });
  }
  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.r > H) obstacles.splice(i, 1);
    }
  }
  function drawObstacles() {
    for (const o of obstacles) {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, 'rgba(200,200,200,0.9)');
      grad.addColorStop(1, 'rgba(100,100,100,0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Game state -----
  let running = true;
  let score = 0;

  function reset() {
    ship.x = W / 2;
    ship.y = H * 0.8;
    ship.vx = ship.vy = 0;
    ship.angle = 0;
    obstacles.length = 0;
    frameCount = 0;
    score = 0;
    running = true;
  }

  function checkCollision() {
    for (const o of obstacles) {
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.r + o.r) return true;
    }
    return false;
  }

  function updateShip() {
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // thrust sound
      beep(440, 0.04);
    }
    // apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // keep inside canvas
    if (ship.x < 0) ship.x = W;
    if (ship.x > W) ship.x = 0;
    if (ship.y < 0) ship.y = H;
    if (ship.y > H) ship.y = 0;
  }
  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.6, ship.r);
    ctx.lineTo(-ship.r * 0.6, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    // draw space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    updateStars();
    drawStars();
    if (running) {
      if (frameCount % OBSTACLE_FREQ === 0) spawnObstacle();
      updateObstacles();
      drawObstacles();
      updateShip();
      drawShip();
      if (checkCollision()) {
        running = false;
        crashAudio.currentTime = 0;
        crashAudio.play();
      }
      score++;
    } else {
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, W / 2, H / 2);
      ctx.fillText('Press Space to Restart', W / 2, H / 2 + 30);
      if (keys[' ']) reset();
    }
    frameCount++;
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
