// Minimal endless runner based on IDEA.md
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Player
  const player = {
    w: 30,
    h: 30,
    x: W / 2 - 15,
    y: H - 30,
    vy: 0,
    speed: 4,
    jumpStrength: -12,
    onGround: true,
    color: '#0af'
  };

  // Obstacles (spikes) – simple rectangles moving left
  const spikes = [];
  let spawnTimer = 0;
  let speed = 3; // tunnel forward speed
  let speedInc = 0.001; // increase per frame
  let gameOver = false;

  const keys = {};
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playJump() { playTone(300, 150); }
  function playHit() { playTone(80, 400); }
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnSpike() {
    // Generate a gap width between 80-150px, then place a spike covering the rest of the width
    const gapX = Math.random() * (W - 120) + 60; // centre of gap
    const gapW = 80 + Math.random() * 70;
    // left spike
    if (gapX - gapW / 2 > 0) {
      spikes.push({ x: W, y: 0, w: gapX - gapW / 2, h: H, color: '#f55' });
    }
    // right spike
    const rightX = gapX + gapW / 2;
    if (rightX < W) {
      spikes.push({ x: W, y: 0, w: W - rightX, h: H, color: '#f55' });
    }
  }

  function update(dt) {
    if (gameOver) return;
    // Player controls
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if ((keys.ArrowUp || keys.Space) && player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJump();
    }
    // gravity
    player.vy += 0.5; // gravity
    player.y += player.vy;
    // floor
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;

    // Move spikes left
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.x -= speed;
      if (s.x + s.w < 0) spikes.splice(i, 1);
    }

    // Spawn logic
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnSpike();
      spawnTimer = 1000; // ms until next gap
    }

    // Collision detection
    for (const s of spikes) {
      if (rectCollision(player, s)) {
        gameOver = true;
        playHit();
        break;
      }
    }

    // increase speed gradually
    speed += speedInc;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001d3d'); // dark sky
    bgGrad.addColorStop(1, '#003566'); // deeper
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // player with rounded corners and slight highlight
    ctx.fillStyle = player.color;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // spikes as triangles pointing downwards (danger)
    for (const s of spikes) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x + s.w, 0);
      ctx.lineTo(s.x + s.w / 2, H);
      ctx.closePath();
      ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
