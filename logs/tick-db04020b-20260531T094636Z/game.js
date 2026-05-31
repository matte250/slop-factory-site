// Pixel Runner – minimal endless side‑scroller
// Canvas element with id="game" expected in the HTML

(() => {
  const canvas = document.getElementById('game');
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const WIDTH = (canvas.width = canvas.offsetWidth || 800);
  const HEIGHT = (canvas.height = canvas.offsetHeight || 200);

  // ----- Game state -----
  // Added background gradient and ground line
  const bgGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGradient.addColorStop(0, '#87CEEB'); // sky blue
  bgGradient.addColorStop(1, '#FFFFFF'); // horizon
  const groundHeight = 20;

  let running = false;
  let score = 0;
  let highScore = Number(localStorage.getItem('pixelRunnerHigh') || 0);
  let speed = 3; // base scroll speed, increases over time
  let spawnTimer = 0;

  // ----- Player -----
  const player = {
    w: 20,
    h: 30,
    x: 50,
    y: HEIGHT - 30,
    vy: 0,
    jumpStrength: -9,
    gravity: 0.4,
    onGround: true,
draw() {
        // Player rendered with a simple gradient for visual appeal
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        grad.addColorStop(0, '#FF0'); // bright top
        grad.addColorStop(1, '#FFA500'); // orange bottom
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        // optional outline
        ctx.strokeStyle = '#000';
        ctx.strokeRect(this.x, this.y, this.w, this.h);
      }
    },
jump() {
        if (this.onGround) {
          this.vy = this.jumpStrength;
          this.onGround = false;
          // Play jump sound
          playBeep(440, 0.1);
        }
      }
    },
  };

  // ----- Obstacles -----
  const obstacles = [];
  const obstacleTypes = [
    { w: 20, h: 40 }, // spike
    { w: 30, h: 20 }, // block
  ];
  function spawnObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    obstacles.push({
      w: type.w,
      h: type.h,
      x: WIDTH,
      y: HEIGHT - type.h,
    });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn logic
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = Math.max(60 - Math.floor(score / 100), 20); // faster as score grows
    }
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#8B0000'); // dark red top
      grad.addColorStop(1, '#FF4500'); // orange red bottom
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });
  }

  // ----- Collision -----
  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  // ----- UI -----
  function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 40);
  }

  // ----- Game Loop -----
  function drawBackground() {
    // Fill sky gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT - groundHeight);
    // Draw ground
    ctx.fillStyle = '#654321'; // brown ground
    ctx.fillRect(0, HEIGHT - groundHeight, WIDTH, groundHeight);
  }

function loop() {
    // Draw background gradient and ground
    drawBackground();
    if (running) {
      player.update();
      updateObstacles();
      if (checkCollision()) {
        endGame();
      }
      player.draw();
      drawObstacles();
      score++;
      if (score % 500 === 0) speed += 0.5; // gradually increase speed
      drawUI();
      requestAnimationFrame(loop);
    } else {
      // Game Over screen
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = '16px monospace';
      ctx.fillText('Press Space or Click to Restart', WIDTH / 2, HEIGHT / 2 + 10);
      ctx.textAlign = 'start';
    }
  }

  // ----- Controls -----
  function startGame() {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') {
      audioCtx.resume();
    }
    // reset state
    obstacles.length = 0;
    score = 0;
    speed = 3;
    spawnTimer = 60;
    player.y = HEIGHT - player.h;
    player.vy = 0;
    running = true;
    requestAnimationFrame(loop);
  }

  function endGame() {
    // Play collision sound on game over
    playBeep(150, 0.3);
    running = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pixelRunnerHigh', highScore);
    }
    // Draw one more frame to show Game Over
    loop();
  }

  // Input listeners
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      if (running) player.jump();
      else startGame();
    }
  });
  canvas.addEventListener('click', () => {
    if (running) player.jump();
    else startGame();
  });

  // Auto‑start on load
  startGame();
})();
