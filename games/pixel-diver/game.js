// Minimal endless‑runner based on IDEA.md
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Player (diver)
  const player = {
    w: 30,
    h: 30,
    x: W / 2 - 15,
    y: H - 50,
    speed: 4,
    color: '#00f',
  };

  // Game state
  let air = 100; // percent
  const obstacles = [];
  const bubbles = [];
  let gameOver = false;
  let frame = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { audioCtx.resume().catch(()=>{}); keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
      color: '#f00',
    });
  }

  function spawnBubble() {
    const size = 15;
    bubbles.push({
      x: Math.random() * (W - size),
      y: -size,
      r: size / 2,
      speed: 1.5,
      color: '#0ff',
    });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;
    // player movement
    if (keys.ArrowLeft) player.x = Math.max(0, player.x - player.speed);
    if (keys.ArrowRight) player.x = Math.min(W - player.w, player.x + player.speed);

    // spawn obstacles/bubbles periodically
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 150 === 0) spawnBubble();

    // move obstacles
    obstacles.forEach(o => o.y += o.speed);
    // move bubbles
    bubbles.forEach(b => b.y += b.speed);

    // remove off‑screen
    while (obstacles.length && obstacles[0].y > H) obstacles.shift();
    while (bubbles.length && bubbles[0].y > H) bubbles.shift();

    // collisions
    for (const o of obstacles) {
      if (rectCollide(player, o)) {
        gameOver = true;
        playTone(150, 0.2); // collision sound
        break;
      }
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const bx = b.x, by = b.y, br = b.r;
      if (player.x < bx + br * 2 && player.x + player.w > bx && player.y < by + br * 2 && player.y + player.h > by) {
        air = Math.min(100, air + 20);
        bubbles.splice(i, 1);
        playTone(600, 0.1); // bubble collect sound
      }
    }

    // air consumption
    if (frame % 30 === 0) air -= 0.5;
    if (air <= 0) {
      gameOver = true;
      playTone(80, 0.3); // out of air beep
    }

    frame++;
  }

  function draw() {
    // background gradient to simulate deep ocean
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001144');
    bgGrad.addColorStop(1, '#000022');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // draw player (simple diver silhouette)
    ctx.fillStyle = player.color;
    // body
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // head
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y - player.h / 2, player.w / 2, Math.PI, 0);
    ctx.fill();
    // optional dark outline for depth
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.w, player.h);

    // draw obstacles with radial gradient (dangerous rocks/creatures)
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(
        o.x + o.w / 2,
        o.y + o.h / 2,
        0,
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w / 2
      );
      grad.addColorStop(0, 'rgba(255,0,0,0.8)');
      grad.addColorStop(1, 'rgba(100,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // draw bubbles with glowing effect
    bubbles.forEach(b => {
      const glow = ctx.createRadialGradient(
        b.x + b.r,
        b.y + b.r,
        0,
        b.x + b.r,
        b.y + b.r,
        b.r
      );
      glow.addColorStop(0, 'rgba(0,255,255,0.8)');
      glow.addColorStop(1, 'rgba(0,255,255,0.1)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x + b.r, b.y + b.r, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // air meter (semi‑transparent background)
    ctx.fillStyle = 'rgba(80,80,80,0.6)';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, air, 10);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
