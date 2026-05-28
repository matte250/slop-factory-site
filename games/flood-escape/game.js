// Simple Flood Escape game targeting canvas with id="game"
// Boat moves left/right with Arrow keys and can thrust upward (Space).
// Water rises from bottom; obstacles spawn randomly and move upward.
// Game ends on collision or water reaching top.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio assets (replace URLs with actual sound files as needed)
  const thrustSound = new Audio('https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@master/FluidR3_GM/acoustic_grand_piano-mp3/001.mp3'); // placeholder
  const collisionSound = new Audio('https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@master/FluidR3_GM/acoustic_grand_piano-mp3/025.mp3');
  const gameOverSound = new Audio('https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@master/FluidR3_GM/acoustic_grand_piano-mp3/050.mp3');
  // optional background music loop
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@master/FluidR3_GM/acoustic_grand_piano-mp3/080.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play().catch(()=>{});

  // Boat definition
  const boat = {
    x: width / 2,
    y: height - 50,
    radius: 12,
    speed: 3,
    thrust: -6,
    vy: 0,
    color: '#00f',
    draw() {
      // draw boat as a triangle with outline
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius);
      ctx.lineTo(this.x - this.radius, this.y + this.radius);
      ctx.lineTo(this.x + this.radius, this.y + this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    update() {
      // apply vertical velocity
      this.y += this.vy;
      // gravity pulls down slowly
      this.vy += 0.2;
      // keep within bounds
      if (this.x < this.radius) this.x = this.radius;
      if (this.x > width - this.radius) this.x = width - this.radius;
      if (this.y < this.radius) this.y = this.radius;
      if (this.y > height - this.radius) this.y = height - this.radius;
    }
  };

    // Water level (0 = bottom, height = top)
    let waterY = height;
    const waterRiseSpeed = 0.3; // pixels per frame
    const waterGradientTop = '#0099ff';
    const waterGradientBottom = '#0066cc';

  // Obstacles
  const obstacles = [];
  const obstacleSpawnInterval = 120; // frames
  let spawnCounter = 0;

  function spawnObstacle() {
    const size = Math.random() * 20 + 10;
    obstacles.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: 1 + Math.random() * 2,
      color: '#555'
    });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // remove if off screen
      if (o.y - o.size > height) obstacles.splice(i, 1);
    }
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.x + o.size / 2, o.y + o.size / 2, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

    function handleInput() {
      if (keys.ArrowLeft) boat.x -= boat.speed;
      if (keys.ArrowRight) boat.x += boat.speed;
      if (keys.Space) {
        // apply thrust only if boat is near bottom (avoid endless upward)
        boat.vy = boat.thrust;
        thrustSound.currentTime = 0;
        thrustSound.play().catch(()=>{});
      }
    }

  function checkCollision() {
    // boat vs obstacles
    for (const o of obstacles) {
      const dx = Math.abs(boat.x - (o.x + o.size / 2));
      const dy = Math.abs(boat.y - (o.y + o.size / 2));
      if (dx < boat.radius + o.size / 2 && dy < boat.radius + o.size / 2) {
        return true;
      }
    }
    // water reaching top
    if (waterY <= 0) return true;
    return false;
  }

  let score = 0;
  let gameOver = false;
  let gameOverPlayed = false; // ensure game over sound plays once
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText(`Score: ${Math.floor(score)}`, width / 2 - 50, height / 2 + 30);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // water with gradient
    waterY -= waterRiseSpeed;
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, height);
    waterGrad.addColorStop(0, waterGradientTop);
    waterGrad.addColorStop(1, waterGradientBottom);
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, width, height - waterY);

    // obstacles
    if (spawnCounter++ >= obstacleSpawnInterval) {
      spawnObstacle();
      spawnCounter = 0;
    }
    updateObstacles();
    drawObstacles();

    // boat
    handleInput();
    boat.update();
    boat.draw();

    // collision
    if (checkCollision()) {
      if (!gameOverPlayed) {
        // play collision and game over sounds once
        collisionSound.play().catch(()=>{});
        gameOverSound.play().catch(()=>{});
        bgMusic.pause();
        gameOverPlayed = true;
      }
      gameOver = true;
    }

    // scoring: distance survived (frames)
    score += 0.1;

    requestAnimationFrame(loop);
  }

  // start game
  loop();
})();
