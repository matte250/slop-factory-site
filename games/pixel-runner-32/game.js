// Simple endless runner for canvas with id="game"
// Pixel Runner – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;
  const groundY = height - 20; // ground position
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  function playJumpSound() { playBeep(300, 100); }
  function playGameOverSound() { playBeep(100, 300); }

  // Game state
  let player = { x: 50, y: groundY - 20, w: 20, h: 20, vy: 0, onGround: true };
  const gravity = 0.8;
  const jumpStrength = -15;
  const speed = 3; // horizontal scroll speed
  let obstacles = [];
  let spawnTimer = 0;
  let distance = 0;
  let running = true;

  // Input – click/tap or space
  const onJump = (e) => {
    if (player.onGround) {
      player.vy = jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
    e.preventDefault();
  };
  canvas.addEventListener('mousedown', onJump);
  canvas.addEventListener('touchstart', onJump);
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') onJump(e); });

  function spawnObstacle() {
    // Random spike size, positioned on ground
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: width, y: groundY - size, w: size, h: size });
  }

  function update() {
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // move obstacles left
    obstacles.forEach(o => o.x -= speed);
    // remove passed obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // spawn new obstacles
    spawnTimer -= speed;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 150 + Math.random() * 150; // distance between obstacles
    }
    // collision detection
    for (let o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        running = false;
        playGameOverSound();
        break;
      }
    }
    distance += speed;
  }

  function drawBackground() {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEFA'); // light sky
    skyGrad.addColorStop(1, '#1E90FF'); // deep sky
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - 20, width, 20);
  }

  function drawPlayer() {
    // simple pixel avatar with eye
    ctx.fillStyle = '#FFD700'; // gold body
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // eye
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + player.w * 0.6, player.y + player.h * 0.3, 2, 2);
  }

  function drawObstacle(ob) {
    // triangular spike aligned to ground
    ctx.fillStyle = '#C00';
    ctx.beginPath();
    ctx.moveTo(ob.x, groundY);
    ctx.lineTo(ob.x + ob.w / 2, groundY - ob.h);
    ctx.lineTo(ob.x + ob.w, groundY);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Background and ground
    drawBackground();
    // Obstacles
    obstacles.forEach(drawObstacle);
    // Player
    drawPlayer();
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + Math.floor(distance / 10), 10, 30);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
