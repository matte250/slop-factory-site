// Minimal side‑scroll runner with simple graphics improvements
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const groundHeight = 20; // height of ground platform
  // simple audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playSound(440, 0.08); }
  function playGameOverSound() { playSound(150, 0.5); }


  // player is a simple triangle character
  const player = {
    x: 50,
    // start on ground platform
    y: height - groundHeight - 30,
    w: 20,
    h: 30,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    onGround: true,
    draw() {
      // draw triangle pointing right
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.h >= height - groundHeight) {
        this.y = height - groundHeight - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) this.vy = this.jumpStrength;
    }
  };

  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames between obstacles
  const speed = 4;
  // cloud handling
  const clouds = [];
  let cloudTimer = 0;
  const cloudInterval = 150; // frames between clouds
  const cloudSpeed = 1;

  function spawnCloud() {
    const radius = 20 + Math.random() * 30;
    const y = 20 + Math.random() * (height / 3);
    clouds.push({ x: width, y, r: radius });
  }

  function updateClouds() {
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= cloudSpeed;
      if (c.x + c.r < 0) clouds.splice(i, 1);
    }
  }

  function drawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function spawnObstacle() {
    const size = 20 + Math.random() * 30; // height 20‑50
    obstacles.push({ x: width, y: height - groundHeight - size, w: 20, h: size });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
  }

  function drawObstacles() {
    // draw obstacles as brown blocks with a slight gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#8B4513'); // saddle brown top
      grad.addColorStop(1, '#A0522D'); // sienna bottom
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
  }

  function checkCollision() {
    const p = player;
    for (const o of obstacles) {
      if (
        p.x < o.x + o.w &&
        p.x + p.w > o.x &&
        p.y < o.y + o.h &&
        p.y + p.h > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  let gameOver = false;
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    // draw sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue top
    skyGrad.addColorStop(1, '#B0E0E6'); // pale blue bottom
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // draw simple clouds
    drawClouds();
    // ground platform
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);

    // update clouds
    if (cloudTimer <= 0) {
      spawnCloud();
      cloudTimer = cloudInterval;
    } else {
      cloudTimer--;
    }
    updateClouds();

    // update & draw player
    player.update();
    player.draw();

    // obstacles
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = obstacleInterval;
    } else {
      obstacleTimer--;
    }
    updateObstacles();
    drawObstacles();

    if (checkCollision()) {
      playGameOverSound();
      gameOver = true;
    }
    requestAnimationFrame(loop);
  }
    
  }

  // start on user interaction (required by some browsers)
  const start = () => {
    // unlock audio on first interaction
    audioCtx.resume();
    canvas.removeEventListener('click', start);
    canvas.addEventListener('click', () => { playJumpSound(); player.jump(); });
    requestAnimationFrame(loop);
  };
  canvas.addEventListener('click', start);
})();
