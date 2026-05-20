// Cosmic Cleanup – a minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const player = { x: width / 2, y: height - 30, w: 20, h: 20, speed: 4 };
  const junk = [];
  let health = 3;
  let frame = 0;
  const keys = {};
  // starfield background
  // sound assets
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  // start music after user interaction to satisfy browsers
  window.addEventListener('click', () => {
    bgMusic.play().catch(() => {});
  }, { once: true });
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
  }

  // input
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnJunk() {
    const size = 15 + Math.random() * 15;
    junk.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 1 + frame / 2000 });
  }

  function update() {
    // move stars for parallax effect
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep in bounds
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // spawn junk roughly every 60 frames
    if (frame % 60 === 0) spawnJunk();

    // update junk positions and check collisions
    for (let i = junk.length - 1; i >= 0; i--) {
      const j = junk[i];
      j.y += j.speed;
      // collision
      if (
        j.x < player.x + player.w &&
        j.x + j.w > player.x &&
        j.y < player.y + player.h &&
        j.y + j.h > player.y
      ) {
        health--;
        crashSound.currentTime = 0;
        crashSound.play().catch(() => {});
        junk.splice(i, 1);
        continue;
      }
      // remove off‑screen
      if (j.y > height) junk.splice(i, 1);
    }
    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // stars background
    ctx.fillStyle = '#444';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // player ship (triangle)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // junk (asteroid shapes)
    ctx.fillStyle = '#f80';
    junk.forEach(j => {
      ctx.beginPath();
      ctx.arc(j.x + j.w / 2, j.y + j.h / 2, Math.max(j.w, j.h) / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + health, 10, 20);
  }

  function loop() {
    if (health <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start game when script loads
  requestAnimationFrame(loop);
})();
