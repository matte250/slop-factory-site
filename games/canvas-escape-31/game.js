// Simple endless‑runner with enhanced graphics based on IDEA.md
// Targets a <canvas id="game"> element present in the HTML.
// The player (a blue rectangle) runs automatically; click/tap to jump.

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function jumpSound() { playSound(440, 0.1); }
  function collisionSound() { playSound(150, 0.3); }

  // Game parameters
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const BASE_SPEED = 3;
  const ACCELERATION = 0.0005; // speed increase per ms
  const OBSTACLE_FREQ = 1500; // ms between spawns (average)

  const groundY = H - 20; // ground line

  // Player object
  const player = {
    x: 50,
    y: groundY,
    w: 20,
    h: 40,
    vy: 0,
    jumping: false,
    draw() {
      // draw player as rounded rectangle with gradient
      const grad = ctx.createLinearGradient(this.x, this.y - this.h, this.x, this.y);
      grad.addColorStop(0, '#4a90e2');
      grad.addColorStop(1, '#007aff');
      ctx.fillStyle = grad;
      const radius = 5;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y - this.h);
      ctx.lineTo(this.x + this.w - radius, this.y - this.h);
      ctx.quadraticCurveTo(this.x + this.w, this.y - this.h, this.x + this.w, this.y - this.h + radius);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x, this.y);
      ctx.lineTo(this.x, this.y - this.h + radius);
      ctx.quadraticCurveTo(this.x, this.y - this.h, this.x + radius, this.y - this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y > groundY) {
        this.y = groundY;
        this.vy = 0;
        this.jumping = false;
      }
    },
  };

  // Obstacles: type 'spike' (triangle) or 'pit' (gap)
  const obstacles = [];
  function spawnObstacle() {
    const type = Math.random() < 0.7 ? 'spike' : 'pit';
    if (type === 'spike') {
      obstacles.push({
        type: 'spike',
        x: W,
        y: groundY,
        w: 20,
        h: 30,
      });
    } else {
      // Pit is a gap; invisible obstacle that the player must be airborne over
      obstacles.push({
        type: 'pit',
        x: W,
        y: groundY,
        w: 40,
        h: 0,
      });
    }
  }

  // Simple cloud objects for parallax background
  const clouds = [];
  function spawnCloud() {
    const cloud = {
      x: W,
      y: Math.random() * (groundY - 100), // keep clouds above ground
      r1: 20 + Math.random() * 15,
      r2: 15 + Math.random() * 10,
      speed: 0.5 + Math.random() * 0.5,
    };
    clouds.push(cloud);
  }

  let lastSpawn = performance.now();
  let startTime = performance.now();
  let speed = BASE_SPEED;
  let gameOver = false;

  function checkCollision(ob) {
    if (ob.type === 'spike') {
      // Simple AABB collision
      const px = player.x;
      const py = player.y - player.h;
      const pw = player.w;
      const ph = player.h;
      const ox = ob.x;
      const oy = ob.y - ob.h; // spike top
      const ow = ob.w;
      const oh = ob.h;
      return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
    } else if (ob.type === 'pit') {
      // Player falls into pit if its bottom is on ground and x overlaps the gap
      const onGround = player.y >= groundY;
      const within = player.x + player.w > ob.x && player.x < ob.x + ob.w;
      return onGround && within;
    }
    return false;
  }

  function update(delta) {
    if (gameOver) return;
    // increase speed over time
    const elapsed = performance.now() - startTime;
    speed = BASE_SPEED + elapsed * ACCELERATION;

    // spawn obstacles at random intervals
    if (performance.now() - lastSpawn > OBSTACLE_FREQ * (0.5 + Math.random())) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // spawn clouds occasionally
    if (Math.random() < 0.01) { // roughly one cloud per 100 frames
      spawnCloud();
    }

    // Update player
    player.update();

    // Update clouds (parallax slower than ground speed)
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.r1 * 2 < 0) clouds.splice(i, 1);
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      if (ob.x + ob.w < 0) obstacles.splice(i, 1);
        else if (checkCollision(ob)) {
          collisionSound();
          gameOver = true;
        }
    }
  }

  function draw() {
    // clear
    ctx.clearRect(0, 0, W, H);
    // draw sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light sky blue
    skyGrad.addColorStop(1, '#b0e0e6'); // pale turquoise
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // draw clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r1, 0, Math.PI * 2);
      ctx.arc(c.x + c.r1 * 0.6, c.y - c.r1 * 0.4, c.r2, 0, Math.PI * 2);
      ctx.arc(c.x - c.r1 * 0.6, c.y - c.r1 * 0.4, c.r2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    });
    // draw ground as a rectangle with texture
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, W, H - groundY);
    // simple ground line
    ctx.fillStyle = '#222';
    ctx.fillRect(0, groundY, W, 4);
    // player
    player.draw();
    // obstacles
    ctx.fillStyle = '#ff3333';
    obstacles.forEach(ob => {
      if (ob.type === 'spike') {
        // draw spike as triangle
        ctx.beginPath();
        ctx.moveTo(ob.x, ob.y);
        ctx.lineTo(ob.x + ob.w / 2, ob.y - ob.h);
        ctx.lineTo(ob.x + ob.w, ob.y);
        ctx.closePath();
        ctx.fill();
      } else if (ob.type === 'pit') {
        // draw gap as black rectangle for visual clue
        ctx.fillStyle = '#000';
        ctx.fillRect(ob.x, groundY, ob.w, 2);
        ctx.fillStyle = '#ff3333';
      }
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

    // Jump on click/tap
    canvas.addEventListener('click', async () => {
      // Ensure audio context is running (required by some browsers)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      if (!player.jumping && player.y >= groundY) {
        player.vy = JUMP_STRENGTH;
        player.jumping = true;
        jumpSound();
      }
    });

  // start animation loop
  requestAnimationFrame(loop);
});
