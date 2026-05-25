// Simple endless runner for canvas#game
// Player: click/tap to jump, double‑tap within 300 ms to dash.
// Obstacles: red spikes and gaps generated procedurally.
// Score: distance traveled (pixels).

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Player -----
  const player = {
    x: 50,
    y: H - 30,
    w: 20,
    h: 30,
    vy: 0,
    onGround: true,
    dashCooldown: 0,
  };
  const GRAVITY = 0.9;
  const JUMP_SPEED = -15;
  const DASH_SPEED = 8;

  // ----- Input handling -----
  let lastTap = 0;
  canvas.addEventListener('mousedown', handleTap);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); handleTap(); });

  function handleTap() {
    // Required to enable audio on first user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    const now = performance.now();
    if (now - lastTap < 300) {
      // double tap → dash
      if (player.dashCooldown <= 0) {
        player.vy = 0;
        player.x += DASH_SPEED * 15; // quick burst forward
        player.dashCooldown = 30; // frames of immunity
        playTone(400, 0.15); // dash sound
      }
    } else if (player.onGround) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      playTone(200, 0.2); // jump sound
    }
    lastTap = now;
  }

  // ----- Obstacles -----
  const obstacles = [];
  const OBSTACLE_SPACING = 200; // distance between generated obstacles
  let obstacleTimer = 0;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    if (type === 'spike') {
      const size = 20 + Math.random() * 30;
      obstacles.push({type: 'spike', x: W, y: H - size, w: size, h: size});
    } else {
      const gap = 40 + Math.random() * 60;
      obstacles.push({type: 'gap', x: W, w: gap, h: H});
    }
  }

  // ----- Game loop -----
  let score = 0;
  let gameOver = false;

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    if (player.dashCooldown > 0) player.dashCooldown--;

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5; // scroll speed
      // collision detection for spikes
      if (o.type === 'spike') {
        if (rectCollide(player, o)) endGame();
      } else if (o.type === 'gap') {
        // gap detection – treat as missing floor
        if (player.x + player.w > o.x && player.x < o.x + o.w && player.onGround) {
          // player is over a gap while on ground → fall
          player.onGround = false; // will fall due to gravity
        }
      }
      // remove off‑screen
      if (o.x + (o.w || 0) < 0) obstacles.splice(i, 1);
    }

    // spawn new obstacles
    obstacleTimer += 5;
    if (obstacleTimer > OBSTACLE_SPACING) {
      spawnObstacle();
      obstacleTimer = 0;
    }

    score += 0.5; // distance based
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // moving clouds (simple white circles)
    const cloudCount = 3;
    for (let i = 0; i < cloudCount; i++) {
      const cx = (performance.now() / 30 + i * 200) % (W + 100) - 50;
      const cy = 50 + Math.sin((performance.now() / 1000) + i) * 10;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.arc(cx + 40, cy + 10, 25, 0, Math.PI * 2);
      ctx.arc(cx - 40, cy + 10, 25, 0, Math.PI * 2);
      ctx.fill();
    }
    // ground line with texture
    ctx.fillStyle = '#555';
    ctx.fillRect(0, H - 5, W, 5);
    // player with rounded rect and gradient
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#00FF00');
    playerGrad.addColorStop(1, '#006400');
    ctx.fillStyle = playerGrad;
    const radius = 4;
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
    // obstacles
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        // stylized spike with gradient and shadow
        const spikeGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        spikeGrad.addColorStop(0, '#ff8080');
        spikeGrad.addColorStop(1, '#b00000');
        ctx.fillStyle = spikeGrad;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      } else if (o.type === 'gap') {
        // gap rendered as a dark canyon with gradient
        const gapGrad = ctx.createLinearGradient(0, 0, 0, H);
        gapGrad.addColorStop(0, '#222');
        gapGrad.addColorStop(1, '#000');
        ctx.fillStyle = gapGrad;
        ctx.fillRect(o.x, 0, o.w, H - 5);
      }
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2 - 20);
      ctx.fillText('Final Score: ' + Math.floor(score), W/2, H/2 + 20);
    }
  }

  function endGame() {
    // collision sound
    playTone(100, 0.4);
    gameOver = true;
  }

  function rectCollide(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  // start
  requestAnimationFrame(loop);
})();
