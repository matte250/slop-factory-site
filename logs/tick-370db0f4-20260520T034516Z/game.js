// Canvas Dodge game implementation
// HTML contains <canvas id="game"></canvas>
(() => {
  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Player
  const player = { x: 80, y: height - 30, radius: 15, vy: 0, onGround: true, crouching: false };
  const GRAVITY = 0.8, JUMP_VELOCITY = -12, SLIDE_TIME = 300;
  let slideTimer = 0;

  // Obstacles
  const obstacles = [];
  const OBSTACLE_SPEED = 4, OBSTACLE_INTERVAL = 1500;
  let lastObstacle = 0;

  // Score
  let startTime = performance.now(), score = 0;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => keys[e.code] = false);
  canvas.addEventListener('mousedown', () => keys['Space'] = true);
  canvas.addEventListener('mouseup', () => keys['Space'] = false);

  function spawnObstacle() {
    const size = 30 + Math.random() * 40;
    obstacles.push({ x: width, y: height - size, w: size, h: size });
  }

  function update(dt) {
    // Jump
    if ((keys['ArrowUp'] || keys['Space']) && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playTone(440, 100); // jump sound
    }
    // Slide / crouch
    if (keys['ArrowDown'] && !player.crouching) {
      player.crouching = true;
      slideTimer = SLIDE_TIME;
      playTone(300, 80); // slide sound
    }
    if (player.crouching) {
      slideTimer -= dt;
      if (slideTimer <= 0) player.crouching = false;
    }
    // Gravity
    player.vy += GRAVITY;
    player.y += player.vy;
    const groundY = height - (player.crouching ? player.radius / 2 : player.radius);
    if (player.y >= groundY) { player.y = groundY; player.vy = 0; player.onGround = true; }

    // Obstacles
    const now = performance.now();
    if (now - lastObstacle > OBSTACLE_INTERVAL) { spawnObstacle(); lastObstacle = now; }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Collision (circle-rect)
    for (const o of obstacles) {
      const nearestX = Math.max(o.x, Math.min(player.x, o.x + o.w));
      const nearestY = Math.max(o.y, Math.min(player.y, o.y + o.h));
      const dx = player.x - nearestX, dy = player.y - nearestY;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        playTone(150, 200); // collision sound
        alert('Game Over! Score: ' + Math.floor(score));
        obstacles.length = 0;
        player.x = 80; player.y = height - 30; player.vy = 0; player.onGround = true; player.crouching = false;
        startTime = performance.now(); score = 0; return;
      }
    }
    // Score
    score = (now - startTime) / 1000;
  }

function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0,0,width,height);
    grad.addColorStop(0, '#e0f7fa');
    grad.addColorStop(1, '#80deea');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);

    // Player with gradient and eye
    const pGrad = ctx.createRadialGradient(player.x, player.y, player.radius*0.2, player.x, player.y, player.radius);
    pGrad.addColorStop(0, '#ffeb3b');
    pGrad.addColorStop(1, '#f44336');
    ctx.fillStyle = pGrad;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(player.x - player.radius/3, player.y - player.radius/3, player.radius/5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(player.x - player.radius/3, player.y - player.radius/3, player.radius/10, 0, Math.PI*2); ctx.fill();

    // Obstacles as rounded rectangles with gradient
    for (const o of obstacles) {
        const oGrad = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
        oGrad.addColorStop(0, '#ff7961');
        oGrad.addColorStop(1, '#c62828');
        ctx.fillStyle = oGrad;
        ctx.beginPath();
        ctx.moveTo(o.x+5, o.y);
        ctx.lineTo(o.x+o.w-5, o.y);
        ctx.quadraticCurveTo(o.x+o.w, o.y, o.x+o.w, o.y+5);
        ctx.lineTo(o.x+o.w, o.y+o.h-5);
        ctx.quadraticCurveTo(o.x+o.w, o.y+o.h, o.x+o.w-5, o.y+o.h);
        ctx.lineTo(o.x+5, o.y+o.h);
        ctx.quadraticCurveTo(o.x, o.y+o.h, o.x, o.y+o.h-5);
        ctx.lineTo(o.x, o.y+5);
        ctx.quadraticCurveTo(o.x, o.y, o.x+5, o.y);
        ctx.fill();
    }

    // Score
    ctx.fillStyle = '#212121';
    ctx.font = '18px Arial';
    ctx.fillText('Score: '+Math.floor(score),10,30);
}

  let lastTime = 0;
  function loop(ts) {
    const dt = ts - lastTime; lastTime = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();