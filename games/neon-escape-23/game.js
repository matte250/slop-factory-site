// Simple endless scroller game for canvas with id='game' (enhanced graphics)
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration + 0.02);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = { x: 80, y: height / 2, w: 30, h: 20, speed: 4 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 90; // frames
  let frame = 0;

  // Score
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 20 + Math.random() * 40;
    const y = Math.random() * (height - size);
    obstacles.push({ x: width, y, w: size, h: size, speed: 3 + Math.random() * 2 });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // Keep within bounds
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Obstacles
    if (frame % obstacleFreq === 0) spawnObstacle();
    obstacles.forEach(ob => ob.x -= ob.speed);
    // Remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // Collision detection
    for (const ob of obstacles) {
      if (ship.x < ob.x + ob.w && ship.x + ship.w > ob.x && ship.y < ob.y + ob.h && ship.y + ship.h > ob.y) {
          gameOver = true;
          playTone(200, 0.2); // crash sound
        break;
      }
    }

    score++;
    if (score % 100 === 0) playTone(500, 0.05);
    frame++;
  }

  function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  // Enable neon glow for obstacles and ship
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 8;

    // Ship (neon triangle)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Obstacles (glowing squares)
    ctx.fillStyle = '#f00';
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 12;
    obstacles.forEach(ob => {
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 2;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
    });
    // Reset shadow for UI
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
