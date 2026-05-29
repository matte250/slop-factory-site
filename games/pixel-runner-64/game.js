// Pixel Runner – minimalist endless runner
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions (could be styled in HTML/CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 200;

  const PLAYER_SIZE = 20;
  // Visual settings
  const GROUND_HEIGHT = 10;
  const PLAYER_COLOR = '#0ff';
  const OBSTACLE_COLOR = '#f80';
  const BACKGROUND_GRADIENT = (() => {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001d3d'); // dark sky
    grad.addColorStop(1, '#70c1b3'); // horizon
    return grad;
  })();

  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;

  let speed = 2; // base speed, will increase
  let speedIncrease = 0.001; // per frame
  let obstacleFrequency = 120; // frames between obstacles
  let obstacleTimer = 0;

  const player = {
    x: 50,
    y: canvas.height - GROUND_HEIGHT - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
      draw() {
        ctx.fillStyle = PLAYER_COLOR;
        // draw player as a rounded square for smoother look
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();
      },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y > canvas.height - this.height) {
        this.y = canvas.height - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
        // play jump sound
        playTone(440, 0.08);
      }
    }
  };

  const obstacles = [];

  function addObstacle() {
    const height = 20 + Math.random() * 30; // 20-50px
    const width = 10 + Math.random() * 20; // 10-30px
    obstacles.push({
      x: canvas.width,
      y: canvas.height - GROUND_HEIGHT - height,
      width,
      height,
        draw() {
        ctx.fillStyle = OBSTACLE_COLOR;
        // draw obstacle as rounded rectangle
        const radius = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  let score = 0;
  let gameOver = false;

  function reset() {
    player.x = 50;
    player.y = canvas.height - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    speed = 2;
    obstacleTimer = 0;
    score = 0;
    gameOver = false;
    loop();
  }

  function loop() {
    if (gameOver) {
      // display game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press Space or Click to Restart', canvas.width / 2, canvas.height / 2 + 30);
      return;
    }

    // clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient
    ctx.fillStyle = BACKGROUND_GRADIENT;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // update player
    player.update();
    player.draw();

    // obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleFrequency) {
      addObstacle();
      obstacleTimer = 0;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      o.draw();
      // collision
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
          gameOver = true;
          // play collision sound
          playTone(200, 0.2);
        }

      // remove off-screen
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    // speed up
    speed += speedIncrease;
    // increase difficulty by decreasing interval
    if (obstacleFrequency > 60 && Math.random() < 0.01) obstacleFrequency--;

    // score
    score++;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(loop);
  }

  // input handling
  function resumeAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      resumeAudio();
      if (gameOver) reset();
      else player.jump();
    }
  });
  canvas.addEventListener('click', () => {
    resumeAudio();
    if (gameOver) reset();
    else player.jump();
  });

  // start the game
  reset();
})();
