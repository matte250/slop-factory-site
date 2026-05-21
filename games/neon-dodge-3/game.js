// Neon Dodge Game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // audio context and beep helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, type = 'sine', duration = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player (neon triangle) 
  const player = {
    x: width / 2,
    y: height - 40,
    size: 30,
    angle: 0, // 0 points up
    speed: 5,
    move: 0 // -1 left, 1 right, 0 none
  };

  // Obstacles array
  const obstacles = [];
  const obstacleTypes = ['circle', 'square'];
  const obstacleSpawnRate = 90; // frames
  let frameCount = 0;
  let score = 0;
  let running = true;

  // Input handling
  const setMove = (dir) => (player.move = dir);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') setMove(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd') setMove(1);
  });
  window.addEventListener('keyup', (e) => {
    if ((e.key === 'ArrowLeft' || e.key === 'a') && player.move === -1) setMove(0);
    if ((e.key === 'ArrowRight' || e.key === 'd') && player.move === 1) setMove(0);
  });

  function spawnObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size) + size / 2;
    const y = -size;
    const speed = 2 + Math.random() * 2;
    obstacles.push({type, x, y, size, speed});
  }

  function update() {
    // Move player
    player.x += player.move * player.speed;
    // keep within bounds
    if (player.x < player.size) player.x = player.size;
    if (player.x > width - player.size) player.x = width - player.size;

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.size > height) {
        obstacles.splice(i, 1);
        score++;
        continue;
      }
      // Collision detection
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (o.type === 'circle') {
        if (dist < o.size / 2 + player.size / 2) {
          running = false;
          // play crash sound
          beep(150, 'sawtooth', 0.3);
        }
      } else { // square
        if (Math.abs(dx) < (o.size / 2 + player.size / 2) && Math.abs(dy) < (o.size / 2 + player.size / 2)) {
          running = false;
          // play crash sound
          beep(150, 'sawtooth', 0.3);
        }
      }
    }

    // Spawn new obstacles
    if (frameCount % obstacleSpawnRate === 0) spawnObstacle();
    frameCount++;
  }

function draw() {
  // background gradient for neon vibe
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // draw player triangle with neon glow
  ctx.save();
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;
  ctx.translate(player.x, player.y);
  ctx.rotate(-Math.PI / 2); // point upward
  ctx.fillStyle = '#0ff'; // neon cyan
  ctx.beginPath();
  ctx.moveTo(0, -player.size / 2);
  ctx.lineTo(player.size / 2, player.size / 2);
  ctx.lineTo(-player.size / 2, player.size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // draw obstacles with glow
  obstacles.forEach(o => {
    ctx.shadowColor = o.type === 'circle' ? '#f0f' : '#ff0';
    ctx.shadowBlur = 10;
    ctx.fillStyle = o.type === 'circle' ? '#f0f' : '#ff0';
    if (o.type === 'circle') {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else { // square
      ctx.fillRect(o.x - o.size / 2, o.y - o.size / 2, o.size, o.size);
    }
    ctx.shadowBlur = 0; // reset blur for next drawing
  });

  // draw score
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + score, 10, 20);
}

  function loop() {
    if (!running) {
      ctx.fillStyle = '#f00';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
