// Simple endless runner for canvas with id "game"
// Based on IDEA.md description

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  let audioCtx;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playBeep(freq, duration) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 200;
  const GROUND_HEIGHT = 20; // height of ground strip

  // Player definition
  const player = {
    x: 50,
    y: HEIGHT - GROUND_HEIGHT - 30, // ground position
    width: 20,
    height: 20,
    vy: 0,
    jumpStrength: -8,
    gravity: 0.4,
    grounded: true,
    draw() {
      // Draw player as a gradient circle for nicer look
      const grad = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        2,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#ff9900');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.height >= HEIGHT - GROUND_HEIGHT) {
        this.y = HEIGHT - this.height;
        this.vy = 0;
        this.grounded = true;
      }
    },
    jump() {
      if (this.grounded) {
        // Play jump sound
        playBeep(440, 100);
        this.vy = this.jumpStrength;
        this.grounded = false;
      }
    }
  };

  // Obstacle definition
  const obstacles = [];
  const obstacleSpeed = 3;
  const obstacleWidth = 20;
  const obstacleHeight = 40;
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  function spawnObstacle() {
    const obs = {
      x: WIDTH,
      y: HEIGHT - GROUND_HEIGHT - obstacleHeight,
      width: obstacleWidth,
      height: obstacleHeight,
      draw() {
        // Draw obstacle with gradient
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        grad.addColorStop(0, '#a00');
        grad.addColorStop(1, '#f44');
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, this.y, this.width, this.height);
      },
      update() {
        this.x -= obstacleSpeed;
      }
    };
    obstacles.push(obs);
  }

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      player.jump();
    }
  });

  // Scoring
  let score = 0;

  // Clouds for parallax background
  const clouds = [];
  const cloudSpeed = 0.5;
  let cloudTimer = 0;
  const cloudInterval = 200; // frames
  function spawnCloud() {
    const radius = 20 + Math.random() * 30;
    const cloud = {
      x: WIDTH,
      y: 20 + Math.random() * (HEIGHT / 2),
      r: radius,
      draw() {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      },
      update() {
        this.x -= cloudSpeed;
      }
    };
    clouds.push(cloud);
  }

  // Main loop
  function loop() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#80c0ff'); // sky
    bgGrad.addColorStop(1, '#c0e0ff'); // horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw ground
    // Use predefined ground height (GROUND_HEIGHT)
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);

    // Update and draw clouds
    if (cloudTimer <= 0) {
      spawnCloud();
      cloudTimer = cloudInterval + Math.random() * 100; // randomize
    } else {
      cloudTimer--;
    }
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.update();
      c.draw();
      if (c.x + c.r < 0) clouds.splice(i, 1);
    }

    // Update player
    player.update();
    player.draw();

    // Spawn obstacles
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = obstacleInterval + Math.random() * 30; // randomize a bit
    } else {
      obstacleTimer--;
    }

    // Update and draw obstacles, remove off‑screen
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.update();
      o.draw();
      // Collision detection
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        // Game over
        alert('Game Over! Score: ' + Math.floor(score));
        // Reset state
        obstacles.length = 0;
        player.y = HEIGHT - player.height;
        player.vy = 0;
        player.grounded = true;
        score = 0;
        return; // stop loop until user refreshes
      }
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
      }
    }

    // Update score based on time survived
    score += 0.1;
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    requestAnimationFrame(loop);
  }

  // Start game
  loop();
})();
