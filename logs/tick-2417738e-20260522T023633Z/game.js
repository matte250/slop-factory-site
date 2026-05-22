// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => { // Enhanced graphics version
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playGameOverSound() { playTone(150, 0.5); }

  // Player definition
  const player = {
    // Draw with simple eyes
    draw() {
      // body
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // eyes
      ctx.fillStyle = '#fff';
      const eyeSize = 4;
      ctx.fillRect(this.x + 6, this.y + 6, eyeSize, eyeSize);
      ctx.fillRect(this.x + this.w - 10, this.y + 6, eyeSize, eyeSize);
    },
    x: 50,
    y: height - 40,
    w: 30,
    h: 30,
    vy: 0,
    jumpStrength: -8,
    gravity: 0.4,
    onGround: true,
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.h >= height) {
        this.y = height - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
jump() {
        if (this.onGround) {
          this.vy = this.jumpStrength;
          this.onGround = false;
          playJumpSound();
        }
      }
  };

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') player.jump();
  });

  // Obstacles
  const obstacles = [];
  // Cloud objects for background
  const clouds = [];
  const cloudSpeed = 0.5;
  const obstacleSpeed = 3;
  const spawnInterval = 120; // frames
  let frameCount = 0;
  function spawnObstacle() {
    // existing obstacle spawning logic
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    if (type === 'spike') {
      const size = 20 + Math.random() * 20;
      obstacles.push({ x: width, y: height - size, w: size, h: size, type: 'spike' });
    } else {
      const gapWidth = 30 + Math.random() * 30;
      obstacles.push({ x: width + gapWidth, y: height, w: gapWidth, h: 0, type: 'gap' });
    }
  }

  // Spawn a simple cloud object
  function spawnCloud() {
    const r = 20 + Math.random() * 15; // radius
    const y = 30 + Math.random() * 50; // vertical position
    clouds.push({ x: width + r, y, r });
  }
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    if (type === 'spike') {
      const size = 20 + Math.random() * 20;
      obstacles.push({ x: width, y: height - size, w: size, h: size, type: 'spike' });
    } else {
      const gapWidth = 30 + Math.random() * 30;
      obstacles.push({ x: width + gapWidth, y: height, w: gapWidth, h: 0, type: 'gap' });
    }
  }

  // Collision detection
  function checkCollision(ob) {
    if (ob.type === 'spike') {
      return !(player.x + player.w < ob.x || player.x > ob.x + ob.w || player.y + player.h < ob.y || player.y > ob.y + ob.h);
    }
    // gaps are handled by checking if player is over void
    if (ob.type === 'gap') {
      const overGap = player.x + player.w > ob.x && player.x < ob.x + ob.w;
      const onGround = player.y + player.h >= height;
      return overGap && onGround;
    }
    return false;
  }

  let gameOver = false;
  let score = 0;

  function update() {
    if (gameOver) return;
    frameCount++;
    // Spawn obstacles and clouds at intervals
    if (frameCount % spawnInterval === 0) spawnObstacle();
    if (frameCount % 200 === 0) spawnCloud();
    player.update();
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= obstacleSpeed;
      if (checkCollision(ob)) { gameOver = true; playGameOverSound(); }
      // Remove off‑screen obstacles
      if (ob.x + ob.w < 0) obstacles.splice(i, 1);
    }
    // Move clouds (parallax)
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= cloudSpeed;
      if (c.x + c.r < 0) clouds.splice(i, 1);
    }
    score++;
  }

  function draw() {
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#b0e0e6'); // lighter near ground
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Simple moving clouds
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ground with gradient
    const groundGrad = ctx.createLinearGradient(0, height - 10, 0, height);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#4b2e2e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height - 10, width, 10);

    // Draw player with simple pixel‑art style (body + eyes)
    player.draw();

    // Draw obstacles
    obstacles.forEach(ob => {
      if (ob.type === 'spike') {
        // draw triangle spike
        ctx.fillStyle = '#c33';
        ctx.beginPath();
        ctx.moveTo(ob.x, ob.y + ob.h);
        ctx.lineTo(ob.x + ob.w / 2, ob.y);
        ctx.lineTo(ob.x + ob.w, ob.y + ob.h);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
