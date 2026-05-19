// Simple side‑scrolling infinite runner targeting canvas with id "game"

(() => {
  // Helper to draw rounded rectangle
  function drawRoundedRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
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
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Resume audio on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    canvas.removeEventListener('pointerdown', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  canvas.addEventListener('pointerdown', resumeAudio);

  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // Game objects
  const player = { x: 50, y: HEIGHT - 50, w: 30, h: 30, vy: 0, onGround: true };
  const gravity = 0.6;
  const jumpStrength = -12;

  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  let score = 0;
  let gameOver = false;

  // Input handling
  const jump = () => {
    // play jump sound
    playTone(400, 0.1);
    if (player.onGround) {
      player.vy = jumpStrength;
      player.onGround = false;
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // Main loop
  function update() {
    if (gameOver) return;
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= HEIGHT) {
      player.y = HEIGHT - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacles
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      const size = 20 + Math.random() * 30;
      obstacles.push({ x: WIDTH, y: HEIGHT - size, w: size, h: size });
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 6; // speed
      // collision
      if (rectIntersect(player, o)) {
        // play hit sound
        playTone(200, 0.2);
        gameOver = true;
      }
      // remove off‑screen (score point)
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
        // play point sound
        playTone(800, 0.05);
      }
    }

    // Draw
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);
    // player as rounded rect
    drawRoundedRect(player.x, player.y, player.w, player.h, 5, '#0a84ff');
    // obstacles as rounded rects
    obstacles.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 4, '#ff3b30'));
    // score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    } else {
      requestAnimationFrame(update);
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Start game
  update();
})();
