// Simple canvas game: Space Debris Dodge
// Assumes a <canvas id="game"></canvas> element exists in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on user interaction (required by some browsers)
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Set canvas size (you can adapt via CSS as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    color: '#0ff',
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const meteors = [];
  const stars = [];
  const STAR_COUNT = 80;
  const STAR_SPEED = 0.4;
  let meteorTimer = 0;

  // Initialize starfield
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
      });
    }
  }
  initStars();
  let score = 0;
  let lastScore = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 2 + score / 1000,
      color: '#f44',
    });
    // Play a quick zap sound for new meteor
    playSound(300, 0.04);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // player movement (arrow keys or A/D)
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    // spawn meteors over time
    meteorTimer += dt;
    if (meteorTimer > 800) { // spawn every 0.8s, faster as score rises
      spawnMeteor();
      meteorTimer = 0;
    }

    // update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // collision
      if (rectIntersect(player, m)) {
        gameOver = true;
        // Play collision explosion sound
        playSound(120, 0.3);
      }
      // remove off‑screen
      if (m.y > canvas.height) meteors.splice(i, 1);
    }

    // update stars (move downwards, wrap)
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += STAR_SPEED;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // update score based on time survived
    score = Math.floor((performance.now() - startTime) / 100);
  }

  // Draw background stars
function drawStars() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#444';
  stars.forEach(s => {
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();
}

function drawMeteor(m) {
  const grad = ctx.createRadialGradient(
    m.x + m.w / 2,
    m.y + m.h / 2,
    0,
    m.x + m.w / 2,
    m.y + m.h / 2,
    m.w / 2
  );
  grad.addColorStop(0, 'rgba(255,100,100,0.9)');
  grad.addColorStop(1, 'rgba(150,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  drawStars();
  // draw player
  drawPlayer();
  // draw meteors
  meteors.forEach(drawMeteor);
  // draw score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 30);
  }
}

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
