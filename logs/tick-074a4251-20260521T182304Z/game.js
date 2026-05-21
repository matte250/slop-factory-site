// Canvas Escape game with enhanced graphics
// Targets <canvas id="game"> in the host page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Create background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#0a0a0a');
  bgGradient.addColorStop(1, '#000000');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Simple repeated background hum
  let humInterval = setInterval(() => playTone(60, 200), 2000);
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player (dot)
  const player = {
    x: width / 2,
    y: height / 2,
    r: 5,
    speed: 3,
    dx: 0,
    dy: 0,
    update() {
      this.x = Math.max(this.r, Math.min(width - this.r, this.x + this.dx));
      this.y = Math.max(this.r, Math.min(height - this.r, this.y + this.dy));
    },
    draw() {
      // Draw player with radial gradient for a glowing effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r * 2);
      grad.addColorStop(0, '#aaffaa');
      grad.addColorStop(1, '#00ff00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Simple moving walls – each wall is a rectangle that slides and shrinks the gap.
  const walls = [];
  const wallThickness = 20;
  let gapSize = 200; // initial gap size in the middle
  const gapShrinkRate = 0.2; // pixels per frame

  function initWalls() {
    // four walls creating a shrinking square gap in the centre
    walls.length = 0;
    walls.push({ // top wall
      x: 0,
      y: 0,
      w: width,
      h: wallThickness,
      dx: 0,
      dy: 0
    }, { // bottom wall
      x: 0,
      y: height - wallThickness,
      w: width,
      h: wallThickness,
      dx: 0,
      dy: 0
    }, { // left wall
      x: 0,
      y: 0,
      w: wallThickness,
      h: height,
      dx: 0,
      dy: 0
    }, { // right wall
      x: width - wallThickness,
      y: 0,
      w: wallThickness,
      h: height,
      dx: 0,
      dy: 0
    });
  }

  function updateWalls() {
    // shrink the central gap uniformly
    gapSize = Math.max(30, gapSize - gapShrinkRate);
    const gx = (width - gapSize) / 2;
    const gy = (height - gapSize) / 2;
    // top wall
    walls[0].w = width;
    walls[0].h = wallThickness;
    walls[0].x = 0;
    walls[0].y = 0;
    // bottom wall
    walls[1].w = width;
    walls[1].h = wallThickness;
    walls[1].x = 0;
    walls[1].y = height - wallThickness;
    // left wall
    walls[2].x = 0;
    walls[2].y = 0;
    walls[2].w = wallThickness;
    walls[2].h = height;
    // right wall
    walls[3].x = width - wallThickness;
    walls[3].y = 0;
    walls[3].w = wallThickness;
    walls[3].h = height;
    // carve the gap by overlaying a clear rectangle (the player can pass)
    // Not needed for collision – we simply keep walls static and rely on gapSize for win condition.
  }

  function drawWalls() {
    // Draw walls with a subtle gradient
    const wallGrad = ctx.createLinearGradient(0, 0, width, height);
    wallGrad.addColorStop(0, '#333333');
    wallGrad.addColorStop(1, '#555555');
    ctx.fillStyle = wallGrad;
    walls.forEach(w => {
      ctx.fillRect(w.x, w.y, w.w, w.h);
    });
    // Optional inner rim for depth
    ctx.strokeStyle = '#777777';
    ctx.lineWidth = 2;
    walls.forEach(w => {
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    });
  }

  function collidesWithWalls() {
    // Simple AABB collision for each wall
    for (const w of walls) {
      if (player.x + player.r > w.x && player.x - player.r < w.x + w.w &&
          player.y + player.r > w.y && player.y - player.r < w.y + w.h) {
        // But allow the central gap area
        const gapLeft = (width - gapSize) / 2;
        const gapTop = (height - gapSize) / 2;
        if (!(player.x > gapLeft && player.x < gapLeft + gapSize &&
              player.y > gapTop && player.y < gapTop + gapSize)) {
          return true;
        }
      }
    }
    return false;
  }

  let score = 0;
  let gameOver = false;
  let lastTime = performance.now();

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) {
      // Dark overlay for game over
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff4444';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Score: ${Math.floor(score)}`, width / 2, height / 2 + 20);
      return;
    }

    // update
    player.update();
    updateWalls();
    score += delta / 1000;

    // check collision
    if (collidesWithWalls()) {
      // collision sound
      playTone(150, 300);
      gameOver = true;
    }

    // render background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    drawWalls();
    // draw gap (transparent area) with subtle border
    const gapX = (width - gapSize) / 2;
    const gapY = (height - gapSize) / 2;
    ctx.clearRect(gapX, gapY, gapSize, gapSize);
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.strokeRect(gapX, gapY, gapSize, gapSize);

    player.draw();

    // score display
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    requestAnimationFrame(loop);
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    updateDirection();
    // Play move sound on any movement key press
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'].includes(e.key)) {
      playTone(300, 100);
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    updateDirection();
  });

  function updateDirection() {
    player.dx = 0; player.dy = 0;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.dy = -player.speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.dy = player.speed;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.dx = player.speed;
  }

  // initialise and start
  initWalls();
  requestAnimationFrame(loop);
})();
