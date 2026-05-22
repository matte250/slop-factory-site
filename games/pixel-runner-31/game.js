// Simple side‑scrolling runner
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Game parameters
  let speed = 2; // pixels per frame
  const gravity = 0.6;
  const jumpStrength = -12;
  let score = 0;
  let gameOver = false;

  // Player square
  const player = { x: 50, y: height - 30, w: 20, h: 20, vy: 0, onGround: true };

  // Obstacles array
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames between spawns

  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // Input handling
    const onJump = (e) => {
      if (gameOver) return;
      if (player.onGround) {
        player.vy = jumpStrength;
        player.onGround = false;
        resumeAudio();
        playBeep(400, 0.15); // jump sound
      }
    };
    window.addEventListener('keydown', (e) => { if (e.code === 'Space') onJump(); });
    canvas.addEventListener('click', onJump);


  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30; // random width/height
    obstacles.push({ x: width, y: height - size, w: size, h: size });
  };

  const update = () => {
    if (gameOver) return;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= height) {
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision detection
        if (
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y
        ) {
          gameOver = true;
          playBeep(200, 0.3); // collision sound
        }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn logic
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
    }
    // increase speed gradually
    speed += 0.001;
    score++;
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#3a3a55');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground with subtle line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, height - 4);
    ctx.lineTo(width, height - 4);
    ctx.stroke();

    // Player as rounded rectangle with slight shadow
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 4);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // reset shadow

    // Obstacles with gradient and rounded corners
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#ff5555');
      grad.addColorStop(1, '#aa2222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 3);
      ctx.fill();
    });

    // Score text with shadow for readability
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.shadowColor = 'transparent';

    // Game over overlay with centered text
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Refresh to play again', width / 2, height / 2 + 20);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  loop();
})();
