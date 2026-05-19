// Neon Runner – minimal canvas endless runner
// Assumes <canvas id="game"></canvas> exists in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.08); }
  function playHitSound() { playTone(150, 0.2); }
  // Optional low‑frequency background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.value = 30;
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  bgOsc.start();

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const OBSTACLE_FREQ = 1500; // ms
  const SPEED_INCREMENT = 0.001; // per frame

  // Player state
  const player = { x: 50, y: height - 30, w: 20, h: 30, vy: 0, onGround: true };

  // Obstacles: each {x, y, w, h}
  const obstacles = [];
  let speed = 4;
  let lastObstacle = 0;
  let running = true;
  let score = 0;

  function reset() {
    player.y = height - player.h;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    speed = 4;
    lastObstacle = 0;
    score = 0;
    running = true;
    requestAnimationFrame(frame);
  }

  function spawnObstacle() {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 30;
    obstacles.push({ x: width, y: height - h, w, h });
  }

  function update(dt) {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= height) {
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // Spawn new obstacles
    if (performance.now() - lastObstacle > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacle = performance.now();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        running = false;
        playHitSound();
        break;
      }
    }

    // Increment speed gradually
    speed += SPEED_INCREMENT;
  }

  function draw() {
    // Background gradient (dark neon)
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0a0a2a');
    bg.addColorStop(1, '#000020');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Grid lines for depth effect
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw player (neon cyan) with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    // Use rounded rectangle for smoother silhouette
    ctx.beginPath();
    const radius = 4;
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

    // Draw obstacles (neon magenta) with subtle glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f0f';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Click to restart', width / 2, height / 2 + 20);
    }
  }

  function frame() {
    if (!running) {
      draw();
      return;
    }
    update();
    draw();
    requestAnimationFrame(frame);
  }

  // Input – jump on click/tap when on ground
    canvas.addEventListener('pointerdown', () => {
      // Ensure audio context is active after first user gesture
      audioCtx.resume();
      if (!running) {
        reset();
        return;
      }
      if (player.onGround) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
        playJumpSound();
      }
    });

  // Start game
  requestAnimationFrame(frame);
})();
