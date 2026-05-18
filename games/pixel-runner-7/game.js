// Simple endless runner for canvas#game
// Based on IDEA.md – Pixel Runner
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => playTone(440, 0.15);
  const playCrashSound = () => playTone(100, 0.4);

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Player
  const player = {x: 50, y: height - 40, w: 20, h: 20, vy: 0, jumpStrength: -12};
  const gravity = 0.5;

  // Obstacles
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  // Game state
  let speed = 3;
  let frame = 0;
  let score = 0;
  let running = true;

  const reset = () => {
    player.y = height - 40; player.vy = 0;
    obstacles.length = 0; obstacleTimer = 0; frame = 0; score = 0; speed = 3; running = true;
  };

  const spawnObstacle = () => {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 30;
    const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    obstacles.push({x: width, y: height - h, w, h, color});
  };

  const update = () => {
    if (!running) return;
    frame++;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y > height - player.h) { player.y = height - player.h; player.vy = 0; }
    // obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) { spawnObstacle(); obstacleTimer = 0; }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision
          if (o.x < player.x + player.w && o.x + o.w > player.x &&
              o.y < player.y + player.h && o.y + o.h > player.y) {
            playCrashSound();
            running = false;
          }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // increase difficulty
    if (frame % 300 === 0) speed += 0.5;
    score = Math.floor(frame / 5);
  };

  // cloud data for simple parallax
  const clouds = [];
  let cloudTimer = 0;
  const cloudInterval = 200;

  const spawnCloud = () => {
    const radius = 20 + Math.random() * 30;
    clouds.push({x: width, y: Math.random() * (height / 2), r: radius, speed: speed * 0.3});
  };

  const draw = () => {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // clouds (parallax)
    cloudTimer++;
    if (cloudTimer > cloudInterval) { spawnCloud(); cloudTimer = 0; }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach((c, i) => {
      c.x -= c.speed;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      if (c.x + c.r < 0) clouds.splice(i, 1);
    });

    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - 20, width, 20);

    // player (rounded)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI * 2);
    ctx.fill();

    // obstacles (colored)
    obstacles.forEach(o => {
      ctx.fillStyle = o.color || '#f00';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', width/2, height/2);
    }
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // input
  canvas.addEventListener('click', () => {
    if (!running) { reset(); return; }
    if (player.y >= height - player.h) {
      player.vy = player.jumpStrength;
      playJumpSound();
    }
  });

  loop();
})();
