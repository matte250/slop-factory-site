// Simple endless‑runner game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let bgAudioStarted = false;
  const bgAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAAAA'); // short silent placeholder
  bgAudio.loop = true;
  bgAudio.volume = 0.1;
  function startAudio() {
    if (!bgAudioStarted) {
      bgAudio.play().catch(() => {});
      bgAudioStarted = true;
    }
  }
  function playCollision() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions (fallback to 800×600)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;
  // initialize stars for background
  initStars();

  const PLAYER_SIZE = 30;
  const PLAYER_SPEED = 4;
  const DEBRIS_SIZE = 20;
  const DEBRIS_SPEED = 3;
  const SPAWN_INTERVAL = 1500; // ms
  const MAX_SHIELDS = 3;

  const stars = [];
  const STAR_COUNT = 100;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  }
  function drawStars() {
    ctx.save();
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  const player = {
    x: canvas.width / 5,
    y: canvas.height / 2 - PLAYER_SIZE / 2,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    shields: MAX_SHIELDS,
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // start background audio on first user interaction
    if (!bgAudioStarted) startAudio();
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  const debris = [];
  let lastSpawn = 0;
  let gameOver = false;

  function spawnDebris() {
    const y = Math.random() * (canvas.height - DEBRIS_SIZE);
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // rad per frame
    debris.push({ x: canvas.width, y, w: DEBRIS_SIZE, h: DEBRIS_SIZE, angle, rotSpeed });
  }

  function update(dt) {
    // move stars for parallax effect
    stars.forEach(s => {
      s.x -= 0.5; // speed
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
        s.alpha = Math.random() * 0.5 + 0.5;
      }
    });
    // player movement
    if (keys.ArrowUp || keys.w) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown || keys.s) player.y += PLAYER_SPEED;
    if (keys.ArrowLeft || keys.a) player.x -= PLAYER_SPEED;
    if (keys.ArrowRight || keys.d) player.x += PLAYER_SPEED;
    // keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // debris movement
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x -= DEBRIS_SPEED;
      // collision detection
      if (
        d.x < player.x + player.w &&
        d.x + d.w > player.x &&
        d.y < player.y + player.h &&
        d.y + d.h > player.y
      ) {
        playCollision();
        player.shields--;
        debris.splice(i, 1);
        if (player.shields <= 0) {
          gameOver = true;
        }
        continue;
      }
      // remove off‑screen debris
      if (d.x + d.w < 0) debris.splice(i, 1);
    }

    // spawn new debris
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnDebris();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background: starfield with gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    drawStars();
    // player ship (white triangle)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h / 2);
    ctx.lineTo(player.x + player.w, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // debris (rotating red squares)
    debris.forEach(d => {
      ctx.save();
      ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
      ctx.rotate(d.angle || 0);
      ctx.fillStyle = '#f44';
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
      // update rotation for next frame
      d.angle = (d.angle + d.rotSpeed) % (Math.PI * 2);
    });
    // shields display
    ctx.fillStyle = '#0f0';
    ctx.font = '16px sans-serif';
    ctx.fillText('Shields: ' + player.shields, 10, 20);
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = '#f88';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
  }

  requestAnimationFrame(loop);
})();
