// Simple endless runner targeting <canvas id="game"></canvas> with improved graphics
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Create simple sky gradient background
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#87CEEB'); // light sky blue
  skyGradient.addColorStop(1, '#4682B4'); // deeper blue

  // Ground strip
  const groundHeight = 40;

  // Parallax clouds
  const clouds = [];
  function spawnCloud() {
    const cloud = {
      x: width,
      y: Math.random() * (height - groundHeight - 80) + 20,
      radius: Math.random() * 20 + 30,
      speed: 0.5 + Math.random() * 0.5
    };
    clouds.push(cloud);
  }
  function updateClouds() {
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.radius < 0) clouds.splice(i, 1);
    }
    if (frame % 150 === 0) spawnCloud();
  }
  function drawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBackground() {
    // Sky
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height - groundHeight);
    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);
    drawClouds();
  }

  // --- Audio Setup ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playCrashSound() { playTone(150, 0.3); }


  // Game parameters
  const gravity = 0.6;
  const jumpStrength = -12;
  const playerSize = 30;
  const obstacleWidth = 30;
  const obstacleGap = 200; // distance between obstacles
  const speed = 4;

  let score = 0;
  let frame = 0;

  const player = {
    x: 50,
    y: height - playerSize,
    vy: 0,
    width: playerSize,
    height: playerSize,
    onGround: true,
jump() {
        if (this.onGround) {
          this.vy = jumpStrength;
          this.onGround = false;
          playJumpSound();
        }
      },
    update() {
      this.vy += gravity;
      this.y += this.vy;
      if (this.y + this.height >= height) {
        this.y = height - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    },
    draw() {
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  };

  const obstacles = [];
  function spawnObstacle() {
    const height = Math.random() * (height * 0.6) + 20;
    obstacles.push({
      x: width,
      y: height < 100 ? height : height, // placeholder, will adjust below
      w: obstacleWidth,
      h: height,
      type: 'top' // top or bottom obstacle for gap
    });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }
    if (frame % Math.floor(obstacleGap / speed) === 0) {
      // create pair of top/bottom obstacles leaving a gap
      const gapHeight = 120;
      const topHeight = Math.random() * (height - gapHeight - 40) + 20;
      const bottomY = topHeight + gapHeight;
      obstacles.push({ x: width, y: 0, w: obstacleWidth, h: topHeight, type: 'top' });
      obstacles.push({ x: width, y: bottomY, w: obstacleWidth, h: height - bottomY, type: 'bottom' });
    }
  }

  function drawObstacles() {
    ctx.fillStyle = '#333';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.width > o.x &&
        player.y < o.y + o.h &&
        player.y + player.height > o.y
      ) {
      // Game over
      playCrashSound();
      cancelAnimationFrame(animationId);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.fillText('Game Over', width / 2 - 60, height / 2);
        ctx.fillText('Score: ' + score, width / 2 - 50, height / 2 + 30);
        return true;
      }
    }
    return false;
  }

  // Input handling
  window.addEventListener('keydown', e => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space' || e.code === 'ArrowUp') player.jump();
  });

  // Touch support – tap to jump
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    player.jump();
  });

  let animationId;
  function loop() {
    // Draw layered background first
    drawBackground();
    // Update and draw moving clouds
    updateClouds();

    // Clear only the ground area to keep background static
    ctx.clearRect(0, 0, width, height - groundHeight);

    player.update();
    player.draw();
    updateObstacles();
    drawObstacles();
    if (checkCollision()) return;
    // simple score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    frame++;
    animationId = requestAnimationFrame(loop);
  }

  // Start game
  loop();
})();
