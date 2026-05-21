// Neon Runner – simple endless runner on canvas with id "game"
// Player: glowing horizontal line that jumps on click/tap.
// Obstacles: vertical bars moving left. Game speeds up over time.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Ensure context is resumed on first interaction (required by browsers)
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  canvas.addEventListener('mousedown', resumeAudio, { once: true });
  canvas.addEventListener('touchstart', resumeAudio, { once: true });

  // Helper to play a simple tone
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playJumpSound() { playTone(440, 0.08); }
  function playHitSound() { playTone(150, 0.3); }

  // Set canvas size (use its existing size if set via CSS/HTML)
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const PLAYER = {
    width: 20,
    height: 4,
    x: 40,
    y: 0, // will be set to ground on init
    vy: 0,
    color: '#0ff', // neon cyan
    jumpStrength: -7,
    gravity: 0.3,
  };

  const obstacles = [];
  let speed = 2; // base speed, will increase
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 90; // frames
  let gameOver = false;
  let score = 0;

  function reset() {
    PLAYER.y = canvas.height - PLAYER.height;
    PLAYER.vy = 0;
    obstacles.length = 0;
    speed = 2;
    spawnTimer = 0;
    score = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const minHeight = 20;
    const maxHeight = canvas.height * 0.6;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    const width = 15 + Math.random() * 10;
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height,
      width,
      height,
      color: '#f0f', // neon magenta
    });
  }

  function update() {
    // Player physics
    PLAYER.vy += PLAYER.gravity;
    PLAYER.y += PLAYER.vy;
    // ground collision
    if (PLAYER.y > canvas.height - PLAYER.height) {
      PLAYER.y = canvas.height - PLAYER.height;
      PLAYER.vy = 0;
    }
    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
        score++;
        // increase speed slightly every obstacle passed
        speed *= 1.02;
      }
    }
    // Spawn logic
    spawnTimer++;
    if (spawnTimer > SPAWN_INTERVAL) {
      spawnObstacle();
      spawnTimer = 0;
    }
    // Collision detection
    for (const o of obstacles) {
      if (
        PLAYER.x < o.x + o.width &&
        PLAYER.x + PLAYER.width > o.x &&
        PLAYER.y < o.y + o.height &&
        PLAYER.y + PLAYER.height > o.y
      ) {
        gameOver = true;
        playHitSound();
        break;
      }
    }
    // Lose if falls below canvas (shouldn't happen with ground logic)
    if (PLAYER.y > canvas.height) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient (dark to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#001133');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // optional parallax stars
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const sr = Math.random() * 1.5;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // player line with neon glow
    ctx.shadowColor = PLAYER.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = PLAYER.color;
    ctx.fillRect(PLAYER.x, PLAYER.y, PLAYER.width, PLAYER.height);
    ctx.shadowBlur = 0; // reset for obstacles

    // obstacles with gradient and slight glow
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(0, o.y, 0, o.y + o.height);
      grad.addColorStop(0, o.color);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.shadowBlur = 0;
    }

    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f66';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (gameOver) {
      draw();
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Input – click or tap makes the player jump if on ground
  canvas.addEventListener('mousedown', () => {
    if (PLAYER.vy === 0 && PLAYER.y >= canvas.height - PLAYER.height) {
      PLAYER.vy = PLAYER.jumpStrength;
      playJumpSound();
    }
  });
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (PLAYER.vy === 0 && PLAYER.y >= canvas.height - PLAYER.height) {
      PLAYER.vy = PLAYER.jumpStrength;
      playJumpSound();
    }
  }, { passive: false });

  // start the game
  reset();
})();
