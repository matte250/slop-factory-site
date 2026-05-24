// Minimal Pixel Dash game for canvas with id="game"
// Player: a rounded square at bottom, moves left/right with arrow keys
// Spikes: falling triangles (spike shape) with simple animation
// Score: survival time in seconds
// Enhanced graphics: gradient background, stars, rounded shapes

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');

  // helper: draw rounded rectangle
  // Audio setup
  const moveSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
  const hitSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
  const bgMusic = new Audio('https://actions.google.com/sounds/v1/ambiences/space_ambience.ogg');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  let musicStarted = false;

  function playMove(){
    moveSound.currentTime = 0;
    moveSound.play();
  }

  function playHit(){
    hitSound.currentTime = 0;
    hitSound.play();
  }

  // helper: draw rounded rectangle
  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
  }

  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  const player = {
    w: 30,
    h: 30,
    x: (width - 30) / 2,
    y: height - 40,
    speed: 5,
    dx: 0,
  };

  const spikes = [];
  const spikeSize = { w: 20, h: 20 };
  const stars = [];
  const starCount = 60;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  const spawnInterval = 800; // ms
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function update(delta) {
    // player movement
    player.dx = 0;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x + player.dx));

    // spawn spikes
    if (performance.now() - lastSpawn > spawnInterval) {
      lastSpawn = performance.now();
      const x = Math.random() * (width - spikeSize.w);
      spikes.push({ x, y: -spikeSize.h, speed: 3 + Math.random() * 2 });
    }

    // move spikes
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.y += s.speed;
      if (s.y > height) spikes.splice(i, 1);
    }

    // collision detection
    for (const s of spikes) {
      if (rectIntersect(player, s)) {
        gameOver = true;
        break;
      }
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + spikeSize.w && a.x + a.w > b.x &&
           a.y < b.y + spikeSize.h && a.y + a.h > b.y;
  }

  function draw() {
  // draw gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#00172d');
  grad.addColorStop(1, '#0a0a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // draw stars
  for (const star of stars) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(star.x, star.y, 2, 2);
  }

    // No clear, background already painted
    // player (rounded square)
    ctx.fillStyle = '#0066ff';
    drawRoundedRect(player.x, player.y, player.w, player.h, 6);
    // spikes (triangular with shading)
    for (const s of spikes) {
      // draw an upward-pointing triangle with gradient shading
      const spikeGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + spikeSize.h);
      spikeGrad.addColorStop(0, '#ff6600');
      spikeGrad.addColorStop(1, '#ff3300');
      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(s.x + spikeSize.w / 2, s.y);
      ctx.lineTo(s.x, s.y + spikeSize.h);
      ctx.lineTo(s.x + spikeSize.w, s.y + spikeSize.h);
      ctx.closePath();
      ctx.fill();
    }
    // score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText(`Final: ${elapsed}s`, width / 2 - 70, height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!gameOver) update(timestamp);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
