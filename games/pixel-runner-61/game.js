// Minimal Endless Runner – Pixel Runner
// Targets canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 200;

  // Player
  const player = { w: 20, h: 20, x: 50, y: H - 40, vy: 0, onGround: true };
  const GRAVITY = 0.6;
  const JUMP = -12;

  // Game state
  let obstacles = [];
  let speed = 2;
  let spawnTimer = 0;
  let score = 0;
  let highScore = Number(localStorage.getItem('pixelRunnerHS') || 0);
  let gameOver = false;

  const reset = () => {
    obstacles = [];
    speed = 2;
    spawnTimer = 0;
    score = 0;
    player.y = H - 40;
    player.vy = 0;
    player.onGround = true;
    gameOver = false;
  };

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playSound = (freq, duration) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const handleInput = () => {
  // Ensure audio context is running
  if (audioCtx.state === 'suspended') audioCtx.resume();

    if (player.onGround) {
      // Play jump sound
      playSound(400, 0.1);
      player.vy = JUMP;
      player.onGround = false;
    }
  };

  // Input listeners
  window.addEventListener('keydown', e => { if (e.code === 'Space') handleInput(); });
  canvas.addEventListener('click', handleInput);

  const spawnObstacle = () => {
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    const width = 20 + Math.random() * 30;
    const x = W;
    if (type === 'spike') {
      const h = 20 + Math.random() * 30;
      obstacles.push({ type, x, w: width, h, y: H - 40 - h });
    } else { // gap
      const gapWidth = 30 + Math.random() * 40;
      obstacles.push({ type, x, w: gapWidth, h: 0, y: H - 40 });
    }
  };

  const update = () => {
    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= H - 40) {
      player.y = H - 40;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    obstacles.forEach(o => o.x -= speed);
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // Spawn logic
    spawnTimer -= speed;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 150 + Math.random() * 100; // distance between obstacles
    }

    // Collision detection
    for (const o of obstacles) {
      if (o.type === 'spike') {
        const coll =
          player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y;
        if (coll) { playSound(150, 0.3); gameOver = true; break; }
      } else { // gap
        const overGap =
          player.x + player.w > o.x && player.x < o.x + o.w &&
          player.y + player.h >= H - 20; // on ground level
        if (overGap) { playSound(150, 0.3); gameOver = true; break; }
      }
    }

    if (!gameOver) {
      score++;
      if (score % 500 === 0) speed += 0.3; // gradual speed increase
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('pixelRunnerHS', highScore);
      }
    }
  };

  const draw = () => {
    // Sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#3a7bd5');
    skyGrad.addColorStop(1, '#00d2ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground with subtle shading
    const groundGrad = ctx.createLinearGradient(0, H - 20, 0, H);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 20, W, 20);

    // Helper to draw rounded rectangle (player)
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };

    // Player – bright cyan rounded square
    ctx.fillStyle = '#0ff';
    roundRect(player.x, player.y, player.w, player.h, 4);

    // Obstacles – draw spikes as triangles, gaps as transparent gaps
    ctx.fillStyle = '#f33';
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(o.x, H - 40);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, H - 40);
        ctx.closePath();
        ctx.fill();
      }
    });

    // UI – white text with drop shadow for readability
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.font = '12px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 15);
    ctx.fillText(`High: ${highScore}`, 10, 30);
    ctx.shadowBlur = 0; // reset

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText('Game Over', W / 2 - 50, H / 2);
      ctx.font = '14px sans-serif';
      ctx.fillText('Click to Restart', W / 2 - 55, H / 2 + 25);
    }
  };

  const loop = () => {
    update();
    draw();
    if (gameOver) {
      // wait for click to restart
      canvas.addEventListener('click', function restart() {
        reset();
        canvas.removeEventListener('click', restart);
        requestAnimationFrame(loop);
      }, { once: true });
    } else {
      requestAnimationFrame(loop);
    }
  };

  // Start the game
  reset();
  requestAnimationFrame(loop);
})();
