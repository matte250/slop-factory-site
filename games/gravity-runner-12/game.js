// Minimal Endless Runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playSound(440, 0.1); }
  function playGameOver() { playSound(150, 0.5); }

  // Ball
  const ball = {x: 80, y: H - 30, r: 15, vy: 0, onGround: false};
  const GRAVITY = 0.6;
  const JUMP_VEL = -12;

  // Platform generation
  const platforms = [];
  const PLAT_W = 120;
  const PLAT_H = 15;
  const SPEED = 4; // world scroll speed
  let distance = 0;

  // Star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
    });
  }

  function spawnPlatform() {
    const last = platforms[platforms.length - 1];
    const x = last ? last.x + PLAT_W + Math.random() * 80 : W; // start off‑screen
    const y = H - 20 - Math.random() * 150; // varying height
    platforms.push({x, y, w: PLAT_W, h: PLAT_H});
  }

  // Initialise first platforms
  for (let i = 0; i < 5; i++) spawnPlatform();

  // Input handling – click or tap, longer press = higher jump
  let pressStart = 0;
  canvas.addEventListener('mousedown', e => { audioCtx.resume(); pressStart = Date.now(); });
  canvas.addEventListener('mouseup', e => {
    const hold = Date.now() - pressStart;
    if (ball.onGround) {
      ball.vy = JUMP_VEL * Math.min(1.5, 1 + hold / 300); // longer press = stronger jump
      ball.onGround = false;
      playJump();
    }
    pressStart = 0;
  });
  // Touch support
  canvas.addEventListener('touchstart', e => { pressStart = Date.now(); e.preventDefault(); });
  canvas.addEventListener('touchend', e => { canvas.dispatchEvent(new MouseEvent('mouseup')); e.preventDefault(); });

  function update() {
    // Apply physics
    ball.vy += GRAVITY;
    ball.y += ball.vy;
    // Collision with platforms (simple top‑side only)
    ball.onGround = false;
    for (const p of platforms) {
      if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w) {
        if (ball.y + ball.r > p.y && ball.y + ball.r - ball.vy <= p.y) {
          ball.y = p.y - ball.r;
          ball.vy = 0;
          ball.onGround = true;
        }
      }
    }
    // Game over if falls below canvas
    if (ball.y - ball.r > H) {
      playGameOver();
      alert('Game Over! Distance: ' + Math.floor(distance));
      document.location.reload();
    }
    // Scroll world leftwards (platforms faster than stars)
    for (const p of platforms) p.x -= SPEED;
    // Move stars for parallax effect
    for (const s of stars) {
      s.x -= SPEED * 0.2;
      if (s.x < 0) s.x = W;
    }
    // Remove off‑screen platforms
    while (platforms.length && platforms[0].x + platforms[0].w < 0) {
      platforms.shift();
      distance += PLAT_W; // count passed platform as distance
    }
    // Add new platforms as needed
    const last = platforms[platforms.length - 1];
    if (last && last.x < W) spawnPlatform();
  }

function draw() {
    ctx.clearRect(0, 0, W, H);
    // Background gradient (dynamic night sky)
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#001');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    // Platforms with gradient and rounded corners
    const platGrad = ctx.createLinearGradient(0, 0, 0, PLAT_H);
    platGrad.addColorStop(0, '#ddd');
    platGrad.addColorStop(1, '#777');
    ctx.fillStyle = platGrad;
    for (const p of platforms) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + PLAT_H/2);
      ctx.arc(p.x + PLAT_H/2, p.y + PLAT_H/2, PLAT_H/2, Math.PI, 1.5*Math.PI);
      ctx.lineTo(p.x + p.w - PLAT_H/2, p.y);
      ctx.arc(p.x + p.w - PLAT_H/2, p.y + PLAT_H/2, PLAT_H/2, 1.5*Math.PI, 0);
      ctx.lineTo(p.x + p.w, p.y + PLAT_H);
      ctx.arc(p.x + p.w - PLAT_H/2, p.y + PLAT_H - PLAT_H/2, PLAT_H/2, 0, 0.5*Math.PI);
      ctx.lineTo(p.x + PLAT_H/2, p.y + PLAT_H);
      ctx.arc(p.x + PLAT_H/2, p.y + PLAT_H - PLAT_H/2, PLAT_H/2, 0.5*Math.PI, Math.PI);
      ctx.closePath();
      ctx.fill();
    }
    // Ball with radial gradient and subtle shadow
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    const ballGrad = ctx.createRadialGradient(ball.x, ball.y, ball.r*0.2, ball.x, ball.y, ball.r);
    ballGrad.addColorStop(0, '#ff0');
    ballGrad.addColorStop(1, '#c90');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    // Distance counter
    ctx.fillStyle = '#0f0';
    ctx.font = '16px sans-serif';
    ctx.fillText('Distance: ' + Math.floor(distance), 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
