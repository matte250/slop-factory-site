// Canvas Runner Game
// Assumes there is a <canvas id="game"></canvas> in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 200;

  // Game parameters
  const gravity = 0.6;
  const jumpStrength = -12;
  let speed = 4; // pixels per frame
  let distance = 0;

  // Player object
  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: height - 30,
    vy: 0,
    onGround: true,
    draw() {
      // Draw player as a gradient circle
      const radius = this.w / 2;
      const grad = ctx.createRadialGradient(this.x + radius, this.y + radius, radius * 0.2, this.x + radius, this.y + radius, radius);
      grad.addColorStop(0, '#ffcc80');
      grad.addColorStop(1, '#ff5722');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + radius, this.y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += gravity;
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
        this.vy = jumpStrength;
        this.onGround = false;
      }
    }
  };

  // Obstacle management
  const obstacles = [];
  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({
      w: size,
      h: size,
      x: width,
      y: height - size,
      passed: false
    });
  }

  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  // Input handling
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function handleInput() {
    // Ensure audio context is resumed on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    player.jump();
    playSound(400, 0.1); // jump sound
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.key === ' ') handleInput(); });
  canvas.addEventListener('click', handleInput);

  // Main loop
  function loop() {
    ctx.clearRect(0, 0, width, height);
    // Draw sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue top
    skyGrad.addColorStop(1, '#b0e0e6'); // lighter bottom
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - 10, width, 10);

    // Update player
    player.update();
    player.draw();

    // Spawn obstacles
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = obstacleInterval - Math.min(60, Math.floor(distance / 1000)); // speed up over time
    }
    obstacleTimer--;

    // Update and draw obstacles with gradient blocks
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // gradient brown block
      const gradObs = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      gradObs.addColorStop(0, '#8d6e63');
      gradObs.addColorStop(1, '#5d4037');
      ctx.fillStyle = gradObs;
      ctx.fillRect(o.x, o.y, o.w, o.h);

      // Collision detection
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // Game over
        playSound(150, 0.3); // collision sound
        alert(`Game Over! Distance: ${Math.floor(distance)}px`);
        document.location.reload();
        return;
      }

      // Remove off‑screen obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Update distance and speed
    distance += speed;
    // Gradually increase speed every 500px
    if (distance % 500 < speed) speed += 0.2;

    // Draw distance text with outline for readability
    ctx.font = '16px sans-serif';
    const distText = `Distance: ${Math.floor(distance)}px`;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeText(distText, 10, 20);
    ctx.fillStyle = '#000';
    ctx.fillText(distText, 10, 20);

    requestAnimationFrame(loop);
  }

  // Start game
  loop();
})();
