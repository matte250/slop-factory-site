// Endless Runner with enhanced graphics targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 200;

  // ----- constants -----
  const GRAVITY = 0.6;
  // ----- sound -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const JUMP_VELOCITY = -12;
  const SLIDE_TIME = 30; // frames
  const OBSTACLE_SPEED = 6;
  const GROUND_HEIGHT = 5;

  // ----- background -----
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#87CEEB'); // sky blue
  bgGradient.addColorStop(1, '#B0E0E6'); // lighter

  // ----- player -----
  const player = {
    x: 50,
    y: height - 40 - GROUND_HEIGHT,
    w: 30,
    h: 40,
    vy: 0,
    onGround: true,
    sliding: false,
    slideTimer: 0,
    frame: 0, // for simple running animation
    draw() {
      // simple pixel‑art runner: body + head + legs animation
      ctx.fillStyle = '#ff0'; // body
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // head
      ctx.fillStyle = '#ffe0bd';
      ctx.fillRect(this.x + 6, this.y - 12, 18, 12);
      // legs (alternating)
      ctx.fillStyle = '#ff0';
      const legHeight = 10;
      const legY = this.y + this.h;
      if (this.sliding) {
        // no legs visible while sliding
      } else {
        if (this.frame % 20 < 10) {
          // left leg forward
          ctx.fillRect(this.x + 5, legY, 6, legHeight);
          ctx.fillRect(this.x + 19, legY, 6, legHeight - 2);
        } else {
          // right leg forward
          ctx.fillRect(this.x + 5, legY, 6, legHeight - 2);
          ctx.fillRect(this.x + 19, legY, 6, legHeight);
        }
      }
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= height - GROUND_HEIGHT) {
        this.y = height - GROUND_HEIGHT - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
      if (this.sliding) {
        this.slideTimer--;
        if (this.slideTimer <= 0) {
          this.sliding = false;
          this.h = 40;
          this.y = height - GROUND_HEIGHT - this.h;
        }
      }
      this.frame++;
    },
    jump() {
      if (this.onGround && !this.sliding) {
        this.vy = JUMP_VELOCITY; playBeep(400,0.1);
        this.onGround = false;
      }
    },
    slide() {
        playBeep(200,0.1);
      if (this.onGround && !this.sliding) {
        this.sliding = true;
        this.slideTimer = SLIDE_TIME;
        this.h = 20;
        this.y = height - GROUND_HEIGHT - this.h;
      }
    }
  };

  // ----- obstacles -----
  const obstacles = [];
  function spawnObstacle() {
    const high = Math.random() < 0.5; // low (tall) or high (short) obstacle
    const o = {
      x: width,
      y: high ? height - 30 - GROUND_HEIGHT : height - 70 - GROUND_HEIGHT,
      w: 20,
      h: high ? 30 : 70,
      draw() {
        // add a simple gradient to obstacles
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        grad.addColorStop(0, '#d32f2f');
        grad.addColorStop(1, '#b71c1c');
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        // optional: draw a small shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(this.x, this.y + this.h, this.w, 4);
      },
      update() {
        this.x -= OBSTACLE_SPEED;
      }
    };
    obstacles.push(o);
  }

  // ----- cloud parallax -----
  const clouds = [];
  function spawnCloud() {
    const cloud = {
      x: width,
      y: Math.random() * (height / 2),
      w: 60 + Math.random() * 40,
      h: 30 + Math.random() * 20,
      speed: 1 + Math.random() * 1.5,
      draw() {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      },
      update() { this.x -= this.speed; }
    };
    clouds.push(cloud);
  }

  let frames = 0;
  let score = 0;

  function loop() {
    // background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // clouds
    if (frames % 180 === 0) spawnCloud();
    clouds.forEach((c, i) => {
      c.update();
      c.draw();
    });
    // remove off‑screen clouds
    while (clouds.length && clouds[0].x + clouds[0].w < 0) clouds.shift();

    // ground
    ctx.fillStyle = '#555';
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);

    // player & obstacles
    player.update();
    player.draw();

    if (frames % 90 === 0) spawnObstacle();
    obstacles.forEach((o) => {
      o.update();
      o.draw();
      // collision detection
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        cancelAnimationFrame(rAF);
        ctx.fillStyle = '#000';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', width / 2 - 80, height / 2);
        return;
      }
    });
    // clean up obstacles and update score
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
      obstacles.shift();
      score++;
    }

    // score display
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    frames++;
    rAF = requestAnimationFrame(loop);
  }
  let rAF = requestAnimationFrame(loop);

  // input handling
  document.addEventListener('keydown', (e) => {
    audioCtx.resume();
    if (e.code === 'Space') player.jump();
    if (e.code === 'ArrowDown') player.slide();
  });
})();
