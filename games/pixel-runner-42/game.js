// Enhanced endless runner with simple graphics
(function() {
  const canvas = document.getElementById('game');
  // audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playLandSound() { playTone(200, 0.07); }
  function playHitSound() { playTone(150, 0.3); }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // set canvas size
  canvas.width = canvas.parentElement.clientWidth || 800;
  canvas.height = canvas.parentElement.clientHeight || 200;

  // game state
  let speed = 2; // pixels per frame
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // player
  const player = {
    x: 50,
    y: canvas.height - 40,
    w: 30,
    h: 30,
    vy: 0,
    grounded: true,
    ducking: false,
    color: '#ff0'
  };

  const GRAVITY = 0.5;
  const JUMP_VELOCITY = -10;

  // obstacles
  const obstacles = [];
  function createObstacle() {
    const height = Math.random() * 30 + 20;
    const width = Math.random() * 20 + 20;
    const isDuck = Math.random() < 0.5; // duck obstacle (low) vs jump obstacle (high)
    const o = {
      x: canvas.width,
      y: isDuck ? canvas.height - height : canvas.height - height - 40,
      w: width,
      h: height,
      color: '#f00'
    };
    obstacles.push(o);
  }

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp' && player.grounded) {
      player.vy = JUMP_VELOCITY;
      player.grounded = false;
      playJumpSound();
    }
    if (e.key === 'ArrowDown') {
      player.ducking = true;
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowDown') player.ducking = false;
  });

  function update() {
    if (gameOver) return;
    frame++;
    // increase difficulty
    if (frame % 600 === 0) speed += 0.2;

    // player physics
    player.y += player.vy;
    player.vy += GRAVITY;
    if (player.y >= canvas.height - 40) {
      player.y = canvas.height - 40;
      player.vy = 0;
      player.grounded = true;
    }
    // play landing sound when grounded
    if (player.grounded && player.vy === 0 && player.y === canvas.height - 40) {
      // optional landing sound could be added here
    }
    // ducking reduces height
    const playerHeight = player.ducking ? player.h / 2 : player.h;
    const playerY = player.ducking ? player.y + player.h / 2 : player.y;

    // spawn obstacles
    if (frame % Math.max(90 - speed * 10, 30) === 0) createObstacle();

    // move obstacles and check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision box check
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        playerY < o.y + o.h &&
        playerY + playerHeight > o.y
      ) {
        gameOver = true;
        break;
      }
      // remove off‑screen
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }
  }

  function draw() {
    // background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#e0f7fa'); // pale cyan
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ground with subtle gradient
    const groundGrad = ctx.createLinearGradient(0, canvas.height - 30, 0, canvas.height);
    groundGrad.addColorStop(0, '#7c795d');
    groundGrad.addColorStop(1, '#4b4a3e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    // player with rounded corners
    ctx.fillStyle = player.color;
    const ph = player.ducking ? player.h / 2 : player.h;
    const py = player.ducking ? player.y + player.h / 2 : player.y;
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, py);
    ctx.lineTo(player.x + player.w - radius, py);
    ctx.quadraticCurveTo(player.x + player.w, py, player.x + player.w, py + radius);
    ctx.lineTo(player.x + player.w, py + ph - radius);
    ctx.quadraticCurveTo(player.x + player.w, py + ph, player.x + player.w - radius, py + ph);
    ctx.lineTo(player.x + radius, py + ph);
    ctx.quadraticCurveTo(player.x, py + ph, player.x, py + ph - radius);
    ctx.lineTo(player.x, py + radius);
    ctx.quadraticCurveTo(player.x, py, player.x + radius, py);
    ctx.closePath();
    ctx.fill();

    // obstacles with gradient fill
    obstacles.forEach(o => {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#ff7f7f');
      obsGrad.addColorStop(1, '#c0392b');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // score / status text
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
