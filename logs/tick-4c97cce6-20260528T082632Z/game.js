// Canvas Runner – simple endless runner
// Assumes an existing <canvas id="game"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // ----- Audio setup -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Set a default size if not configured in HTML/CSS
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 400;

  // ---------- Game objects ----------
  const player = {
    x: 50,
    y: 0,
    w: 30,
    h: 50,
    vy: 0,
    jumpForce: -12,
    grounded: false,
  };

  const obstacles = [];
  const obstacleSpeed = 4;
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms

  let score = 0;
  let gameOver = false;

  // ---------- Utility ----------
  const rectsCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  let audioStarted = false;
  const jump = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
    // Jump sound
    playTone(440, 0.08);
    if (player.grounded) {
      player.vy = player.jumpForce;
      player.grounded = false;
    }
  };
    if (player.grounded) {
      player.vy = player.jumpForce;
      player.grounded = false;
    }
  };

  // Input (mouse/touch or Space key)
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
  document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });

  // ---------- Visual helpers ----------
  const drawBackground = () => {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87ceeb'); // sky blue
    grad.addColorStop(1, '#b0e0e6'); // pale blue
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawGround = () => {
    const groundY = canvas.height - player.h;
    ctx.fillStyle = '#654321'; // brown ground
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    // optional line at ground top
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
  };

  const drawRoundedRect = (x, y, w, h, r, fillStyle) => {
    ctx.fillStyle = fillStyle;
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

  // ---------- Game loop ----------
  const loop = timestamp => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Game Over – Score: ${score}`, canvas.width / 2, canvas.height / 2);
      return;
    }
    requestAnimationFrame(loop);

    // Clear and draw background
    drawBackground();
    drawGround();

    // Player physics
    const gravity = 0.5;
    player.vy += gravity;
    player.y += player.vy;
    // Ground check
    const groundY = canvas.height - player.h;
    if (player.y > groundY) {
      player.y = groundY;
      player.vy = 0;
      player.grounded = true;
    }

    // Draw player with rounded corners
    drawRoundedRect(player.x, player.y, player.w, player.h, 6, '#0a74da');

    // Spawn obstacles
    if (timestamp - lastSpawn > spawnInterval) {
      lastSpawn = timestamp;
      const height = 30 + Math.random() * 40; // 30‑70px tall
      obstacles.push({
        x: canvas.width,
        y: canvas.height - height,
        w: 20,
        h: height,
      });
    }

    // Update and draw obstacles
    ctx.fillStyle = '#c0392b';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= obstacleSpeed;
      // Draw obstacle with rounded corners and gradient
      const obsGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
      obsGrad.addColorStop(0, '#c0392b');
      obsGrad.addColorStop(1, '#e74c3c');
      drawRoundedRect(obs.x, obs.y, obs.w, obs.h, 4, obsGrad);


      // Collision
      if (rectsCollide(player, obs)) {
        // Collision sound
        playTone(150, 0.2);
        gameOver = true;
      }

      // Remove off‑screen obstacles and increase score
      if (obs.x + obs.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}` , 10, 20);
  };

  requestAnimationFrame(loop);
})();
