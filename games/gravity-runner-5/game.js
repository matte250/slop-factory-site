// Gravity Runner – simple side‑scrolling game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  // Audio context and helper
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const playTone = (freq, duration = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  let gameOverSoundPlayed = false;
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Game settings
  const GRAVITY = 0.5;
  const THRUST = -10;
  const BALL_RADIUS = 15;
  const OBSTACLE_SPEED = 3;
  const GAP_HEIGHT = 120;
  const OBSTACLE_WIDTH = 40;
  const SPAWN_INTERVAL = 1500; // ms

  let ballY = height / 2;
  let ballV = 0;
  let obstacles = [];
  let lastSpawn = 0;
  let paused = false;
  let score = 0;

  const reset = () => {
    gameOverSoundPlayed = false;
    ballY = height / 2;
    ballV = 0;
    obstacles = [];
    lastSpawn = 0;
    score = 0;
    paused = false;
    requestAnimationFrame(loop);
  };

  const spawnObstacle = () => {
    const gapY = Math.random() * (height - GAP_HEIGHT - 40) + 20; // ensure gap within bounds
    obstacles.push({x: width, gapY});
  };

  const update = (dt) => {
    if (paused) return;
    // physics
    ballV += GRAVITY;
    ballY += ballV;

    // spawn obstacles
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // move obstacles
    obstacles.forEach(o => o.x -= OBSTACLE_SPEED);
    // remove off‑screen
    obstacles = obstacles.filter(o => o.x + OBSTACLE_WIDTH > 0);

    // collision detection
    for (const o of obstacles) {
      const withinX = o.x < BALL_RADIUS * 2 && o.x + OBSTACLE_WIDTH > 0;
      if (withinX) {
        const top = o.gapY;
        const bottom = o.gapY + GAP_HEIGHT;
        if (ballY - BALL_RADIUS < top || ballY + BALL_RADIUS > bottom) {
          if (!gameOverSoundPlayed) { playTone(220, 0.3, 'sawtooth'); gameOverSoundPlayed = true; }
        paused = true; // game over
        }
      }
    }
    // fall off bottom or top
    if (ballY - BALL_RADIUS > height || ballY + BALL_RADIUS < 0) paused = true;

    // score based on passed obstacles
    obstacles.forEach(o => {
      if (!o.passed && o.x + OBSTACLE_WIDTH < BALL_RADIUS) {
        o.passed = true;
        ++score;
        playTone(880, 0.05, 'sine'); // score tone
      }
    });
  };

  const draw = () => {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87CEEB'); // sky blue
    bgGrad.addColorStop(1, '#fff'); // horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw ball with radial gradient and shadow
    const ballGrad = ctx.createRadialGradient(BALL_RADIUS * 2, ballY, BALL_RADIUS * 0.2, BALL_RADIUS * 2, ballY, BALL_RADIUS);
    ballGrad.addColorStop(0, '#fff');
    ballGrad.addColorStop(0.5, '#ff5722');
    ballGrad.addColorStop(1, '#b71c1c');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(BALL_RADIUS * 2, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0; // reset
    // draw obstacles with gradient
    const obsGrad = ctx.createLinearGradient(0, 0, 0, height);
    obsGrad.addColorStop(0, '#388e3c');
    obsGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = obsGrad;
    obstacles.forEach(o => {
      // top block
      ctx.fillRect(o.x, 0, OBSTACLE_WIDTH, o.gapY);
      // bottom block
      ctx.fillRect(o.x, o.gapY + GAP_HEIGHT, OBSTACLE_WIDTH, height - (o.gapY + GAP_HEIGHT));
    });
    // draw score with style
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    // draw ground line
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 5);
    ctx.lineTo(width, height - 5);
    ctx.stroke();
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', width / 2, height / 2);
    }
  };

  let lastTime = 0;
  const loop = (timestamp) => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!paused) requestAnimationFrame(loop);
  };

  // input handling – click or tap gives thrust, also restarts on game over
  const onInput = (e) => {
    e.preventDefault();
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (paused) {
      reset();
      return;
    }
    ballV = THRUST;
    playTone(440, 0.08, 'triangle'); // thrust sound
  };
  canvas.addEventListener('mousedown', onInput);
  canvas.addEventListener('touchstart', onInput);

  // start game
  reset();
})();
