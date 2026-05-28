// Pixel Runner – simple endless side‑scroll runner
(() => {
  const canvas = document.getElementById('game');
  // Audio context for simple sound effects
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJumpSound() { beep(600, 0.1); }
  function playCrashSound() { beep(150, 0.4); }
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 20;
   const GROUND_Y = height - 30;
   let score = 0;
   let lastScoreInt = 0;

  const player = {
    x: 50,
    y: GROUND_Y - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    onGround: true,
    jump() {
      if (this.onGround) {
        this.vy = JUMP_SPEED;
        this.onGround = false;
        playJumpSound();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= GROUND_Y) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.onGround = true;
      }
    },
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#ffa500'); // orange gradient
      ctx.fillStyle = grad;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  };

  const obstacles = [];
  const OBSTACLE_SPEED = 4;
  const OBSTACLE_MIN_GAP = 120;
  const OBSTACLE_MAX_GAP = 300;
  let nextObstacleIn = OBSTACLE_MIN_GAP;

  function spawnObstacle() {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 30;
    obstacles.push({
      x: width,
      y: GROUND_Y - h,
      w,
      h
    });
  }

function updateObstacles() {
     nextObstacleIn -= OBSTACLE_SPEED;
     if (nextObstacleIn <= 0) {
       spawnObstacle();
       nextObstacleIn = OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP);
     }
     for (let i = obstacles.length - 1; i >= 0; i--) {
       const o = obstacles[i];
       o.x -= OBSTACLE_SPEED;
       if (o.x + o.w < 0) obstacles.splice(i, 1);
     }
   }

   // clouds
   const clouds = [];
   const CLOUD_SPEED = 1;
   const CLOUD_SPAWN_INTERVAL = 200; // frames
   let cloudTimer = CLOUD_SPAWN_INTERVAL;
   function spawnCloud() {
     const w = 60 + Math.random() * 40;
     const h = 30 + Math.random() * 20;
     const y = 20 + Math.random() * 80;
     clouds.push({ x: width, y, w, h });
   }
   function updateClouds() {
     cloudTimer--;
     if (cloudTimer <= 0) {
       spawnCloud();
       cloudTimer = CLOUD_SPAWN_INTERVAL + Math.random() * 100;
     }
     for (let i = clouds.length - 1; i >= 0; i--) {
       const c = clouds[i];
       c.x -= CLOUD_SPEED;
       if (c.x + c.w < 0) clouds.splice(i, 1);
     }
   }
   function drawClouds() {
     ctx.fillStyle = 'rgba(255,255,255,0.8)';
     for (const c of clouds) {
       ctx.beginPath();
       ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
       ctx.fill();
     }
   }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  let gameOver = false;
  function loop() {
    if (gameOver) return;
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87CEEB'); // sky blue
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // ground
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, height);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#332211');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);
    // simple clouds
    drawClouds();
    // score display
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);

    player.update();
    player.draw();

    updateObstacles();
     updateClouds();
     // draw obstacles with gradient
     const obsGrad = ctx.createLinearGradient(0, 0, 0, height);
     obsGrad.addColorStop(0, '#f33');
     obsGrad.addColorStop(1, '#800');
     ctx.fillStyle = obsGrad;
     for (const o of obstacles) {
       ctx.fillRect(o.x, o.y, o.w, o.h);
     }

    // update score
    score += 0.1;
    if (Math.floor(score) > lastScoreInt) {
      playJumpSound(); // simple tick sound per point
      lastScoreInt = Math.floor(score);
    }

    if (checkCollision()) {
      gameOver = true;
      playCrashSound();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    requestAnimationFrame(loop);
  }

  // resume audio on interaction
  window.addEventListener('click', () => audioCtx.resume());
  // input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      player.jump();
    }
  });

  // start
  loop();
})();
