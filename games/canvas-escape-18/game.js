// Minimal endless runner for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match element dimensions
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  const player = { x: 50, y: 0, w: 30, h: 30, vy: 0 };
  const gravity = 0.5;
  const jumpStrength = -10;
  const groundY = canvas.height - player.h;

  let obstacles = [];
  let speed = 3; // pixels per frame
  let frames = 0;
  let score = 0;
  let running = true;

  const input = { jump: false };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function initAudio(){ if(!audioInitialized){ audioCtx.resume(); audioInitialized = true; } }
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJumpSound(){ playTone(400, 0.08); }
  function playGameOverSound(){
    // simple descending beeps
    playTone(300, 0.15);
    setTimeout(()=>playTone(200,0.2),180);
  }
  let gameOverSoundPlayed = false;
  const handleJump = () => { if (player.y >= groundY) { input.jump = true; playJumpSound(); } initAudio(); };
  window.addEventListener('keydown', e => { if (e.code === 'Space') handleJump(); });
  canvas.addEventListener('click', handleJump);

  function spawnObstacle() {
    const height = 30 + Math.random() * 50;
    const gap = Math.random() * 100; // optional gap height (unused for now)
    obstacles.push({ x: canvas.width, y: groundY - height, w: 20, h: height });
  }

  function update() {
    // player physics
    if (input.jump) { player.vy = jumpStrength; input.jump = false; }
    player.vy += gravity;
    player.y += player.vy;
    if (player.y > groundY) { player.y = groundY; player.vy = 0; }

    // obstacles movement
    obstacles.forEach(ob => ob.x -= speed);
    // remove off-screen obstacles
    obstacles = obstacles.filter(ob => ob.x + ob.w > 0);

    // spawn new obstacles periodically
    if (frames % Math.floor(100 / speed) === 0) spawnObstacle();

    // collision detection
    for (const ob of obstacles) {
      if (
        player.x < ob.x + ob.w &&
        player.x + player.w > ob.x &&
        player.y < ob.y + ob.h &&
        player.y + player.h > ob.y
      ) {
        running = false;
        break;
      }
    }

    // increase difficulty
    speed += 0.001; // gradual acceleration
    score = Math.floor(frames * speed / 10);
    frames++;
  }

  function drawBackground() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#b0e0e6'); // pale turquoise
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Ground stripe
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
  }

  function drawPlayer() {
    ctx.fillStyle = '#0a74da';
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
  }

  function drawObstacle(ob) {
    // Randomly choose a style based on width
    if (ob.w > 15) {
      // rectangle with slight gradient
      const grad = ctx.createLinearGradient(0, ob.y, 0, ob.y + ob.h);
      grad.addColorStop(0, '#aa1111');
      grad.addColorStop(1, '#660000');
      ctx.fillStyle = grad;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    } else {
      // spike triangle
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(ob.x, groundY + player.h);
      ctx.lineTo(ob.x + ob.w / 2, groundY + player.h - ob.h);
      ctx.lineTo(ob.x + ob.w, groundY + player.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  function draw() {
    drawBackground();
    drawPlayer();
    obstacles.forEach(drawObstacle);
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (!running) {
      // Play game over sound once
      if (!gameOverSoundPlayed) {
        playGameOverSound();
        gameOverSoundPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`,
        canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop() {
    if (running) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with overlay
    }
  }

  // start
  loop();
})();
