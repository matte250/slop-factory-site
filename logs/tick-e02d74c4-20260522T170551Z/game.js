// Minimal endless runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  function resumeAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  canvas.addEventListener('click', resumeAudio, {once:true});
  canvas.addEventListener('keydown', resumeAudio, {once:true});
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump(){ playTone(400, 0.08); }
  function playGameOver(){ playTone(150, 0.5); }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

// Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const PLAYER_X = width * 0.2;
  const OBSTACLE_SPEED = 4;
  const SPAWN_INTERVAL = 1500; // ms
  // Starfield constants
  const STAR_COUNT = Math.floor((width * height) / 5000);
  const STAR_SPEED_MIN = 0.5;
  const STAR_SPEED_MAX = 2.0;
  let stars = [];
  function initStars(){
    stars = [];
    for(let i=0;i<STAR_COUNT;i++){
      stars.push({
        x: Math.random()*width,
        y: Math.random()*height,
        size: Math.random()*2+1,
        speed: STAR_SPEED_MIN + Math.random()*(STAR_SPEED_MAX-STAR_SPEED_MIN)
      });
    }
  }

  let playerY = height - PLAYER_SIZE;
  let velocityY = 0;
  let isJumping = false;
  let obstacles = [];
  let lastSpawn = 0;
  let gameOver = false;

  function reset() {
    initStars();
    playerY = height - PLAYER_SIZE;
    velocityY = 0;
    obstacles = [];
    lastSpawn = performance.now();
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const gapHeight = Math.random() * 80 + 40; // height of gap from bottom
    const size = Math.random() * 40 + 20; // obstacle thickness
    obstacles.push({x: width, w: size, gapY: gapHeight});
  }

  function update(dt) {
    // player physics
    // (existing code unchanged)
    // player physics
    if (isJumping) {
      velocityY = JUMP_VELOCITY;
      isJumping = false;
    }
    velocityY += GRAVITY;
    playerY += velocityY;
    if (playerY > height - PLAYER_SIZE) {
      playerY = height - PLAYER_SIZE;
      velocityY = 0;
    }
    // obstacles
    obstacles.forEach(o => o.x -= OBSTACLE_SPEED);
    // remove offscreen
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // spawn new
    const now = performance.now();
    if (now - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = now;
    }
    // collision
    for (const o of obstacles) {
      if (PLAYER_X + PLAYER_SIZE > o.x && PLAYER_X < o.x + o.w) {
        // check if player is in the gap
        if (playerY + PLAYER_SIZE > height - o.gapY) {
          gameOver = true;
          break;

      }
    }
  }

  function draw() {
    // clear canvas
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0d0d1a');
    bgGrad.addColorStop(1, '#1a0d2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // neon glow for player & obstacles
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    // player
    ctx.fillStyle = '#0ff';
    ctx.fillRect(PLAYER_X, playerY, PLAYER_SIZE, PLAYER_SIZE);
    // obstacles (upper part, leaving gap at bottom)
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => {
      ctx.fillRect(o.x, 0, o.w, height - o.gapY);
    });
    // game over overlay
    if (gameOver) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
    }
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    } else {
      // restart on click
      canvas.addEventListener('click', reset, {once: true});
      canvas.addEventListener('keydown', e => { if (e.code === 'Space') reset(); }, {once: true});
    }
  }

  // input handling
  canvas.addEventListener('click', () => { isJumping = true; playJump(); });
  canvas.addEventListener('keydown', e => { if (e.code === 'Space') isJumping = true; });
  canvas.setAttribute('tabindex', '0'); // make focusable for key events

  reset();
})();
