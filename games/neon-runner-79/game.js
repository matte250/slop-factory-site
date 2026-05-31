// Minimal endless runner for canvas with id="game"
// Neon square jumps over obstacles, score increases with distance.

(() => {
  // Audio setup using Web Audio API
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // resume in case it was suspended
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playBeep(freq, dur) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJumpSound() { playBeep(300, 0.1); }
  function playGameOverSound() { playBeep(100, 0.4); }

  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  const player = {
    x: 50,
    y: height - 30,
    size: 30,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.6,
    onGround: true,
  };

  const obstacles = [];
  const particles = []; // simple neon particles
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  function reset() {
    player.y = height - player.size;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    obstacleTimer = 0;
    score = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({
      x: width,
      y: height - size,
      w: size,
      h: size,
      speed: 4 + Math.random() * 2,
    });
  }

  function update() {
    // player physics (existing)
    player.vy += player.gravity;
    player.y += player.vy;
    // generate particles on jump impulse
    if (player.vy < -2) {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: player.x + player.size / 2,
          y: player.y + player.size,
          vy: Math.random() * 2 + 1,
          alpha: 1,
          size: Math.random() * 3 + 2,
        });
      }
    }
    // update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    // original player physics continuation
    if (player.y + player.size >= height) {
      player.y = height - player.size;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // (duplicate physics removed)

    // obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      // remove off-screen
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.size > o.x &&
        player.y < o.y + o.h &&
        player.y + player.size > o.y
      ) {
        gameOver = true;
        playGameOverSound();
        break;
      }
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background gradient (dark neon vibe)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw particles (fade out)
    ctx.globalAlpha = 1;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = 'rgba(0,255,255,' + p.alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1; // reset

    // Neon player with gradient and glow
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.size);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#00f');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // Reset shadow for subsequent drawings
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Neon obstacles with inner gradient
    for (const o of obstacles) {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#f44');
      obsGrad.addColorStop(1, '#800');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
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

  // input handling
  function jump() {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
    if (e.key === 'r' && gameOver) reset();
  });
  canvas.addEventListener('click', jump);

  // start
  reset();
})();
