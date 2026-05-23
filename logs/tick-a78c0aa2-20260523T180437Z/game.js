// Simple side‑scrolling runner based on IDEA.md
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Set canvas to full width/height of its container or a fixed size.
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;
  // initialize background stars
  initStars();

  // Player (glowing dot)
  const player = {
    x: 50,
    y: height - 20,
    radius: 10,
    vy: 0,
    jumpStrength: -12,
    color: '#0ff',
    onGround: true,
  };

  const gravity = 0.6;
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const speed = 4; // world scroll speed
  // stars for background
  const starCount = 80;
  let stars = [];
  function initStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: speed * 0.5 + Math.random(),
      });
    }
  }
  let obstacles = [];
  let frames = 0;
  let score = 0;
  let running = true;

  function spawnObstacle() {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 40;
    obstacles.push({
      x: width,
      y: height - h,
      w,
      h,
      color: '#f0f',
    });
  }

  function update() {
    if (!running) return;
    frames++;
    // increase score each frame (~60 per second)
    if (frames % 60 === 0) score++;

    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y >= height - player.radius) {
      player.y = height - player.radius;
      player.vy = 0;
      player.onGround = true;
    }

    // move obstacles left
    obstacles.forEach(o => o.x -= speed);
    // move stars for parallax effect
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    });
    // remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // spawn new obstacles periodically
    if (frames % 120 === 0) spawnObstacle();

    // collision detection (dot vs rectangle)
    for (const o of obstacles) {
      const withinX = player.x + player.radius > o.x && player.x - player.radius < o.x + o.w;
      const withinY = player.y + player.radius > o.y && player.y - player.radius < o.y + o.h;
      if (withinX && withinY) {
        running = false;
        // play collision sound
        playTone(100, 0.3);
        break;
      }
    }
  }

  function draw() {
    // clear
    ctx.clearRect(0, 0, width, height);
    // background with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000011');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars (parallax)
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });

    // player with neon glow
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = player.color;
    const grad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.2, player.x, player.y, player.radius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, player.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // obstacles with neon glow
    obstacles.forEach(o => {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = o.color;
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.restore();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '20px sans-serif';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }

  // input handling
  function jump() {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      // play jump sound
      playTone(300, 0.1);
    }
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.key === ' ') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // start
  loop();
})();
