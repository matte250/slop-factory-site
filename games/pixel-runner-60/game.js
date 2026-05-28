// Simple endless runner with improved graphics for canvas#game
// Player jumps on click/tap, obstacles scroll left
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 2000; // ms between obstacles

  const player = {x: 50, y: H - PLAYER_SIZE, w: PLAYER_SIZE, h: PLAYER_SIZE, vy: 0, onGround: true};
  const obstacles = [];
  let lastObs = 0;
  let gameOver = false;

  const reset = () => {
    player.y = H - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    lastObs = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  };

  // Jump on click/tap
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Simple tone player
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  // Background ambience (soft drone) - plays every 2 s while alive
  const bgGain = audioCtx.createGain();
  bgGain.gain.value = 0.03;
  const playBackground = () => {
    const osc = audioCtx.createOscillator();
    osc.frequency.value = 150;
    osc.type = 'sine';
    osc.connect(bgGain);
    bgGain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  };
  const bgInterval = setInterval(() => {
    if (!gameOver) playBackground();
  }, 2000);
  // Collision sound
  const playHit = () => playTone(220, 0.2);

  canvas.addEventListener('click', async () => {
    // Resume audio context on first interaction if needed
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    if (gameOver) reset();
    else if (player.onGround) {
      player.vy = JUMP_VELOCITY; player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  });

  const spawnObstacle = () => {
    const height = Math.random() * (H * 0.6) + 20;
    const y = H - height;
    obstacles.push({x: W, y, w: OBSTACLE_WIDTH, h: height});
  };

  const rectsCollide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const loop = (timestamp) => {
    if (gameOver) return;
    // Clear
    ctx.clearRect(0, 0, W, H);
    // Background with gradient sky and parallax hills
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB'); // top
    skyGrad.addColorStop(1, '#4682B4'); // bottom
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // Hills layer (far)
    ctx.fillStyle = '#5a7d9a';
    ctx.beginPath();
    ctx.arc(-W * 0.2, H * 0.7, W * 0.8, Math.PI, 0);
    ctx.arc(W * 0.8, H * 0.7, W * 0.8, Math.PI, 0);
    ctx.rect(0, H * 0.7, W, H * 0.3);
    ctx.fill();
    // Hills layer (near) – moves with obstacles
    ctx.fillStyle = '#3b5a7a';
    ctx.beginPath();
    ctx.arc(-W * 0.1 + (timestamp/20 % W), H * 0.8, W * 0.6, Math.PI, 0);
    ctx.arc(W * 0.9 + (timestamp/20 % W), H * 0.8, W * 0.6, Math.PI, 0);
    ctx.rect(0, H * 0.8, W, H * 0.2);
    ctx.fill();
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > H - PLAYER_SIZE) {player.y = H - PLAYER_SIZE; player.vy = 0; player.onGround = true;}
    // Draw player - green gradient circle
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w/2,
      player.y + player.h/2,
      player.w/4,
      player.x + player.w/2,
      player.y + player.h/2,
      player.w/2
    );
    playerGrad.addColorStop(0, '#a0ff90');
    playerGrad.addColorStop(1, '#2c7a2c');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();
    // Obstacles with red gradient
    const obsGrad = ctx.createLinearGradient(0, 0, 0, H);
    obsGrad.addColorStop(0, '#ff7f7f');
    obsGrad.addColorStop(1, '#b22222');
    ctx.fillStyle = obsGrad;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5; // scroll speed
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // collision
      if (rectsCollide(player, o)) {playHit(); gameOver = true; break;}
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Spawn new obstacles
    if (timestamp - lastObs > OBSTACLE_GAP) {spawnObstacle(); lastObs = timestamp;}
    // If game over display text
    if (gameOver) {
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', W/2, H/2);
    } else {
      requestAnimationFrame(loop);
    }
  };

  // Start game
  reset();
})();
