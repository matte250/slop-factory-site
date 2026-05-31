// Simple endless runner for a canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 200;

  // Game parameters
  let speed = 2; // base scrolling speed
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // Player definition
  const player = {
    x: 50,
    y: HEIGHT - 30,
    w: 20,
    h: 30,
    vy: 0,
    jumpStrength: -8,
    gravity: 0.4,
    onGround: true,
    draw() {
      ctx.fillStyle = '#0a0';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.h >= HEIGHT) {
        this.y = HEIGHT - this.h;
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
        // play jump sound
        playTone(300, 0.1);
      }
    }
  };

  // Obstacles (simple spikes)
  const obstacles = [];
  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({
      x: WIDTH,
      y: HEIGHT - size,
      w: size,
      h: size,
    });
  }

  // Simple clouds for background
  const clouds = [];
  function spawnCloud() {
    const r = 20 + Math.random() * 30;
    clouds.push({
      x: WIDTH + r,
      y: 20 + Math.random() * (HEIGHT / 2 - 20),
      r,
    });
  }
  function updateClouds() {
    clouds.forEach(c => c.x -= speed * 0.5);
    // remove off-screen
    for (let i = clouds.length - 1; i >= 0; i--) {
      if (clouds[i].x + clouds[i].r < 0) clouds.splice(i, 1);
    }
    if (frame % 200 === 0) spawnCloud();
  }

  // Input handling
  window.addEventListener('keydown', e => {
    // Ensure AudioContext is running after first user gesture
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      player.jump();
    }
    if (gameOver && (e.code === 'Enter' || e.code === 'Space')) {
      reset();
    }
  });

  function reset() {
    speed = 2;
    frame = 0;
    score = 0;
    gameOver = false;
    obstacles.length = 0;
    player.y = HEIGHT - player.h;
    player.vy = 0;
    loop();
  }

  // Collision detection
  function collides(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.h + a.y > b.y;
  }

  // Main loop
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, WIDTH / 2, HEIGHT / 2);
      ctx.fillText('Press Space to Restart', WIDTH / 2, HEIGHT / 2 + 30);
      return;
    }

    // Background gradient (sky)
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#4da6ff');
    grad.addColorStop(1, '#a0d8ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Update and draw clouds
    updateClouds();
    ctx.fillStyle = '#fff';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ground line
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - 5);
    ctx.lineTo(WIDTH, HEIGHT - 5);
    ctx.stroke();

    // Update player
    player.update();
    player.draw();

    // Spawn obstacles
    if (frame % Math.max(80 - speed * 5, 30) === 0) {
      spawnObstacle();
    }

    // Update obstacles (draw spikes)
    ctx.fillStyle = '#a00';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // draw as triangle spike
      ctx.beginPath();
      ctx.moveTo(o.x, HEIGHT);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, HEIGHT);
      ctx.closePath();
      ctx.fill();
      // Collision
      if (collides(player, o)) {
        // play collision sound
        playTone(100, 0.2);
        gameOver = true;
      }
      // Remove off-screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Increase difficulty
    if (frame % 600 === 0) speed += 0.3;

    // Score display
    score = Math.floor(frame / 10);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    frame++;
    requestAnimationFrame(loop);
  }

  // Start the game
  loop();
})();
