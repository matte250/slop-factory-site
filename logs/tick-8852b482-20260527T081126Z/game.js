// Simple side‑scrolling "Canvas Escape" game
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playTone(440, 0.1); }
  function playHit() { playTone(150, 0.3); }
  function playRestart() { playTone(660, 0.15); }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const PLAYER_SIZE = 20;
  const GROUND_HEIGHT = 30;
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const OBSTACLE_WIDTH = 20;
  const GAP_WIDTH = 60;

  let speed = 2; // base scroll speed (px per frame)
  let frame = 0;
  let running = true;

  const player = {
    x: 50,
    y: H - GROUND_HEIGHT - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  };

  const obstacles = [];

  function spawnObstacle() {
    // random spike or gap
    if (Math.random() < 0.5) {
      // spike: rectangle from ground up
      const height = 15 + Math.random() * 25;
      obstacles.push({
        type: 'spike',
        x: W,
        y: H - GROUND_HEIGHT - height,
        width: OBSTACLE_WIDTH,
        height,
      });
    } else {
      // gap: just a missing ground segment
      obstacles.push({
        type: 'gap',
        x: W,
        width: GAP_WIDTH,
      });
    }
  }

  function update() {
    if (!running) return;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // ground collision
    const groundY = H - GROUND_HEIGHT - PLAYER_SIZE;
    if (player.y > groundY) {
      player.y = groundY;
      player.vy = 0;
    }

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + (o.width || 0) < 0) obstacles.splice(i, 1);
    }

    // spawn logic
    if (frame % Math.max(80 - speed * 10, 30) === 0) spawnObstacle();

    // collision detection
    for (const o of obstacles) {
      if (o.type === 'spike') {
        const hitX = player.x + player.width > o.x && player.x < o.x + o.width;
        const hitY = player.y + player.height > o.y;
        if (hitX && hitY) {
          running = false;
          playHit();
        }
      } else if (o.type === 'gap') {
        // if player is over the gap and on ground, they fall
        const overGap = player.x + player.width > o.x && player.x < o.x + o.width;
        const onGround = player.y + player.height >= H - GROUND_HEIGHT;
        if (overGap && onGround) {
          player.vy = JUMP_SPEED; // fall through gap
        }
      }
    }

    // speed ramp
    speed += 0.0005;
    frame++;
  }

function draw() {
    // sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // ground with gradient
    const groundGrad = ctx.createLinearGradient(0, H - GROUND_HEIGHT, 0, H);
    groundGrad.addColorStop(0, '#8B5A2B');
    groundGrad.addColorStop(1, '#3e2723');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);

    // obstacles – draw spikes as triangles
    ctx.fillStyle = '#ff0000';
    for (const o of obstacles) {
      if (o.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(o.x, H - GROUND_HEIGHT);
        ctx.lineTo(o.x + o.width / 2, o.y);
        ctx.lineTo(o.x + o.width, H - GROUND_HEIGHT);
        ctx.closePath();
        ctx.fill();
      }
    }

    // player – rounded square with gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y + player.height);
    playerGrad.addColorStop(0, '#00ff00');
    playerGrad.addColorStop(1, '#006400');
    ctx.fillStyle = playerGrad;
    const r = 4; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.width - r, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + r);
    ctx.lineTo(player.x + player.width, player.y + player.height - r);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - r, player.y + player.height);
    ctx.lineTo(player.x + r, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // simple game‑over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }
    }

    // player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // simple game‑over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }

  // input – click or tap anywhere
  canvas.addEventListener('pointerdown', () => {  // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!running) {
      // restart
      obstacles.length = 0;
      player.y = H - GROUND_HEIGHT - PLAYER_SIZE;
      player.vy = 0;
      speed = 2;
      frame = 0;
      running = true;
      requestAnimationFrame(loop);
} else if (player.vy === 0) {
          player.vy = JUMP_SPEED;
          playJump();
        }
  });

  // start game
  requestAnimationFrame(loop);
})();
