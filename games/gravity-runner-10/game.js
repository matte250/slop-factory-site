// Gravity Runner – minimal canvas game
// Assumes an HTML <canvas id="game"></canvas> present.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game parameters
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const BALL_RADIUS = 12;
  const SCROLL_SPEED = 3;

  // Player ball
  const ball = { x: 80, y: HEIGHT - BALL_RADIUS, vy: 0, onGround: true };

  // Simple obstacle array – each obstacle is {x, y, w, h}
  const obstacles = [];
  // Particle trail for ball
  const particles = [];
  let gapTimer = 0;

  function spawnObstacle() {
    const width = 20 + Math.random() * 30;
    const height = 20 + Math.random() * 40;
    obstacles.push({ x: WIDTH, y: HEIGHT - height, w: width, h: height });
  }

  function update() {
    // Player physics
    ball.vy += GRAVITY;
    ball.y += ball.vy;
    if (ball.y > HEIGHT - BALL_RADIUS) {
      ball.y = HEIGHT - BALL_RADIUS;
      ball.vy = 0;
      ball.onGround = true;
    } else {
      ball.onGround = false;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Generate particles behind the ball when moving
    if (!ball.onGround) {
      particles.push({
        x: ball.x - BALL_RADIUS,
        y: ball.y,
        vx: -1,
        vy: 0,
        r: 2 + Math.random() * 2,
        alpha: 0.8,
      });
    } else {
      // small dust when rolling on ground
      particles.push({
        x: ball.x - BALL_RADIUS,
        y: HEIGHT - 5,
        vx: -0.5,
        vy: -0.2,
        r: 1 + Math.random() * 1,
        alpha: 0.5,
      });
    }

    // Spawn logic
    gapTimer -= SCROLL_SPEED;
    if (gapTimer <= 0) {
      spawnObstacle();
      gapTimer = 100 + Math.random() * 150; // distance to next obstacle
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ball.x + BALL_RADIUS > o.x &&
        ball.x - BALL_RADIUS < o.x + o.w &&
        ball.y + BALL_RADIUS > o.y
      ) {
        // Game over – stop animation
        cancelAnimationFrame(animId);
        playTone(200, 0.3); // collision sound
        ctx.fillStyle = 'red';
        ctx.font = '24px sans-serif';
        ctx.fillText('Game Over', WIDTH / 2 - 60, HEIGHT / 2);
        return;
      }
    }

    draw();
    animId = requestAnimationFrame(update);
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#a0d8f1');
    bgGrad.addColorStop(1, '#f0f8ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ground with gradient
    const groundGrad = ctx.createLinearGradient(0, HEIGHT - 20, 0, HEIGHT);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#3b2210');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);

    // Particle trail (fades)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Ball with radial gradient
    const ballGrad = ctx.createRadialGradient(
      ball.x - BALL_RADIUS / 3,
      ball.y - BALL_RADIUS / 3,
      BALL_RADIUS / 5,
      ball.x,
      ball.y,
      BALL_RADIUS
    );
    ballGrad.addColorStop(0, '#aaffaa');
    ballGrad.addColorStop(1, '#006600');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles with rounded corners
    ctx.fillStyle = '#b33';
    for (const o of obstacles) {
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.w - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      ctx.lineTo(o.x + o.w, o.y + o.h - radius);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      ctx.lineTo(o.x + radius, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Input – click or tap makes the ball jump if on ground
  canvas.addEventListener('pointerdown', () => {
    // Resume audio context on first interaction
    audioCtx.resume();
    if (ball.onGround) {
      ball.vy = JUMP_VELOCITY;
      ball.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  });

  // Start loop
  let animId = requestAnimationFrame(update);
})();
