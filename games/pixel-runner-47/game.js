// Pixel Runner – simple endless runner
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Player definition
  const player = {
    w: 20,
    h: 20,
    x: 50,
    y: H - 20,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.6,
    onGround: true,
  };

  // Obstacle definition
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames
  let speed = 4; // scroll speed, increases over time
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  // Simple jump sound
  const playJump = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };
  // Collision / game over sound
  const playCollision = () => {
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    noise.buffer = buffer;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.3);
  };

  const reset = () => {
    player.y = H - player.h;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    obstacleTimer = 0;
    speed = 4;
    score = 0;
    gameOver = false;
    loop();
  };

  const jump = () => {
    // ensure audio context is running
    resumeAudio();
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJump();
    }
  };

  // Input handling
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('mousedown', jump);

  const update = () => {
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > H - player.h) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      const size = 20 + Math.random() * 30;
      obstacles.push({ x: W, y: H - size, w: size, h: size });
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        playCollision();
        break;
      }
    }
    // increase difficulty
    speed += 0.001;
    score++;
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb');
    bgGrad.addColorStop(1, '#1e90ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ground line
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 5);
    ctx.lineTo(W, H - 5);
    ctx.stroke();

    // player as rounded square
    ctx.fillStyle = '#00ff00';
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // obstacles with random shades of red
    for (const o of obstacles) {
      const shade = Math.floor(155 + Math.random() * 100);
      ctx.fillStyle = `rgb(${shade},0,0)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Click to restart', W / 2, H / 2 + 20);
    }
  };

  const loop = () => {
    if (!gameOver) update();
    draw();
    if (gameOver) {
      // wait for click to restart
      canvas.addEventListener('mousedown', reset, { once: true });
    } else {
      requestAnimationFrame(loop);
    }
  };

  // start game
  loop();
})();
