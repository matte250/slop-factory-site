// Neon Runner – minimal endless runner
// Targets <canvas id="game"></canvas> in the host HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set a fixed size; adjust if needed.
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 200;

  const player = {
    x: 50,
    y: canvas.height - 30,
    w: 20,
    h: 20,
    vy: 0,
    jumpStrength: -9,
    onGround: true,
  };

  const gravity = 0.4;
  const speed = 3; // world scroll speed
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames between spawns
  let score = 0;
  let running = true;

  // Audio setup – simple beep sounds using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
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
  const playJumpSound = () => playBeep(440, 0.1);
  const playCrashSound = () => playBeep(110, 0.3);

  // Input – click or tap makes the player jump.
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  };
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const loop = () => {
    if (!running) return;
    // ----- Update -----
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= canvas.height) {
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacles move left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
      obstacleTimer = 0;
      const height = 20 + Math.random() * 30; // variable height
      obstacles.push({ x: canvas.width, y: canvas.height - height, w: 20, h: height });
    }

    // Collision detection
    for (const o of obstacles) {
      if (rectCollide(player, o)) {
        running = false;
        playCrashSound();
        break;
      }
    }

    // Score accumulates per frame
    if (running) score++;

    // ----- Render -----
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background – gradient neon night
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#020024');
    bgGrad.addColorStop(1, '#090979');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player – neon rounded square with glow
    const drawPlayer = () => {
      const radius = 4;
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0ff';
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
      ctx.shadowBlur = 0;
    };
    drawPlayer();

    // Obstacles – neon bars with glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    for (const o of obstacles) {
      // Gradient color for each obstacle
      const grad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      grad.addColorStop(0, '#ff00ff');
      grad.addColorStop(1, '#800080');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.shadowBlur = 0;

    // Score display – neon text
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(score / 60)}`, 10, 20);
    ctx.shadowBlur = 0;

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText(`Final Score: ${Math.floor(score / 60)}`, canvas.width / 2, canvas.height / 2 + 20);
    } else {
      requestAnimationFrame(loop);
    }
  };

  // Start the loop
  requestAnimationFrame(loop);
})();
