// game.js – simple endless runner based on IDEA.md

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // ----- constants -----
  const GRAVITY = 0.6;
  // ----- audio assets -----
  const jumpSound = new Audio('https://freesound.org/data/previews/331/331912_3248244-lq.mp3'); // jump
  const slideSound = new Audio('https://freesound.org/data/previews/170/170128_2394245-lq.mp3'); // slide
  const crashSound = new Audio('https://freesound.org/data/previews/341/341695_6265257-lq.mp3'); // crash
  // ensure sounds can play without user gesture delay (some browsers require interaction)
  const unlockAudio = () => {
    [jumpSound, slideSound, crashSound].forEach(s => s.play().catch(()=>{}));
  };
  window.addEventListener('click', unlockAudio, {once:true});
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 40;
  const GROUND_Y = HEIGHT - 80;
  const OBSTACLE_SPEED = 5;
  const OBSTACLE_FREQ = 1500; // ms
  const SLIDE_TIME = 500; // ms

  // ----- game state -----
  let score = 0;
  let lastObstacleTime = 0;
  let gameOver = false;
  const obstacles = [];

  // ----- player -----
  const player = {
    x: 80,
    y: GROUND_Y - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    jumping: false,
    sliding: false,
    slideTimer: 0,
    update() {
      // apply gravity
      if (this.y + this.h < GROUND_Y) {
        this.vy += GRAVITY;
        this.y += this.vy;
        this.jumping = true;
        if (this.y + this.h > GROUND_Y) {
          this.y = GROUND_Y - this.h;
          this.vy = 0;
          this.jumping = false;
        }
      }
      // slide handling
      if (this.sliding) {
        this.slideTimer -= delta;
        if (this.slideTimer <= 0) {
          this.sliding = false;
          this.h = PLAYER_SIZE; // restore height
          this.y = GROUND_Y - this.h;
        }
      }
    },
    draw() {
      ctx.fillStyle = '#0a84ff';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    jump() {
      if (!this.jumping && !this.sliding) {
        this.vy = JUMP_VELOCITY;
        this.jumping = true;
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
    },
    slide() {
      if (!this.jumping && !this.sliding) {
        this.sliding = true;
        this.slideTimer = SLIDE_TIME;
        this.h = PLAYER_SIZE / 2; // half height when sliding
        this.y = GROUND_Y - this.h;
        slideSound.currentTime = 0;
        slideSound.play();
      }
    }
  };

  // ----- obstacle helper -----
  function spawnObstacle() {
    const height = 30 + Math.random() * 60; // variable height
    const width = 20 + Math.random() * 30;
    obstacles.push({
      x: WIDTH,
      y: GROUND_Y - height,
      w: width,
      h: height
    });
  }

  // ----- input -----
  window.addEventListener('keydown', e => {
    if (gameOver) return;
    if (e.key === 'ArrowUp') player.jump();
    else if (e.key === 'ArrowDown') player.slide();
  });

  // ----- main loop -----
  let lastTime = performance.now();
  let delta = 0;
  function loop(now) {
    delta = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      update(now); // pass current timestamp to update for obstacle timing
      render();
      requestAnimationFrame(loop);
    }
  }

  function update(nowTime) {
    // spawn obstacles based on current time
    if (nowTime - lastObstacleTime > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacleTime = nowTime;
    }
    // update player
    player.update();
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= OBSTACLE_SPEED;
      // collision
      if (rectIntersect(player, obs)) {
        gameOver = true;
        crashSound.currentTime = 0;
        crashSound.play();
      }
      // remove off‑screen
      if (obs.x + obs.w < 0) {
        obstacles.splice(i, 1);
        score += 1; // reward for passing
      }
    }
  }

  function drawRoundedRect(x, y, w, h, radius, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  const clouds = [];
  function spawnCloud() {
    const size = 30 + Math.random() * 40;
    clouds.push({ x: WIDTH, y: Math.random() * (GROUND_Y - 150), size, speed: 1 + Math.random() * 1.5 });
  }

  function render() {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#b0e0e6'); // pale turquoise
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, GROUND_Y);

    // clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => drawRoundedRect(c.x, c.y, c.size * 1.6, c.size, c.size / 2, ctx.fillStyle));
    // update cloud positions
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.size * 1.6 < 0) clouds.splice(i, 1);
    }
    if (Math.random() < 0.01) spawnCloud();

    // ground with slight gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, HEIGHT);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#333');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    // player (rounded square)
    ctx.fillStyle = '#0a84ff';
    drawRoundedRect(player.x, player.y, player.w, player.h, 6, ctx.fillStyle);

    // obstacles with rounded corners
    obstacles.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 4, '#ff3b30'));

    // score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 40);
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // start loop
  requestAnimationFrame(loop);
})();
