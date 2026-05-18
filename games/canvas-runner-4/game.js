// Canvas Runner Game
// Implements a minimal side‑scrolling runner as described in IDEA.md
// Canvas element must have id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 200;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    jump: () => playTone(440, 0.1), // A4 short beep
    slide: () => playTone(220, 0.1), // lower beep
    gameOver: () => playTone(110, 0.5), // deep longer beep
  };

  // Player (circle)
  const player = {
    x: 80,
    y: height - 30,
    radius: 15,
    vy: 0,
    gravity: 0.8,
    jumpStrength: -15,
    grounded: true,
    sliding: false,
    // when sliding the hitbox height is reduced
    get hitbox() {
      return {
        left: this.x - this.radius,
        right: this.x + this.radius,
        top: this.y - (this.sliding ? this.radius / 2 : this.radius),
        bottom: this.y + (this.sliding ? this.radius / 2 : this.radius),
      };
    },
  };

  // Obstacles (rectangles)
  const obstacles = [];
  const obstacleSpeed = 4;
  const obstacleSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  function spawnObstacle() {
    // Randomly choose type: block (high) or low bar (requires slide)
    const type = Math.random() < 0.5 ? 'high' : 'low';
    const w = 20;
    const h = type === 'high' ? 60 : 20;
    const y = type === 'high' ? height - h : height - 30; // low bar sits on ground, player must slide
    obstacles.push({ x: width, y, w, h, type });
  }

  function update(dt) {
    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y >= height - 30) {
      player.y = height - 30;
      player.vy = 0;
      player.grounded = true;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn obstacles
    if (Date.now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = Date.now();
    }

    // Collision detection (circle‑rect)
    for (const o of obstacles) {
      const distX = Math.abs(player.x - (o.x + o.w / 2));
      const distY = Math.abs(player.y - (o.y + o.h / 2));
      if (distX > (o.w / 2 + player.radius)) continue;
      if (distY > (o.h / 2 + player.radius)) continue;
      if (distX <= o.w / 2 || distY <= o.h / 2) {
        // Simple collision – end game
        cancelAnimationFrame(animId);
        sounds.gameOver();
        alert('Game Over');
        return;
      }
    }
  }

  function draw() {
    // Sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#b0e0e6'); // lighter near ground
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - 20, width, 20);

    // Player (circle with stroke)
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aa8800';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Obstacles with type‑specific styling
    for (const o of obstacles) {
      if (o.type === 'high') {
        // Tall block with gradient
        const grad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
        grad.addColorStop(0, '#d2691e');
        grad.addColorStop(1, '#8b4513');
        ctx.fillStyle = grad;
        ctx.fillRect(o.x, o.y, o.w, o.h);
      } else {
        // Low bar – rounded rectangle
        ctx.fillStyle = '#ff6600';
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
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Input handling
  function onJump(e) {
    if (player.grounded) {
      player.vy = player.jumpStrength;
      player.grounded = false;
      sounds.jump();
    }
  }
  function onSlideStart(e) {
    player.sliding = true;
    sounds.slide();
  }
  function onSlideEnd(e) {
    player.sliding = false;
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') onJump();
    if (e.code === 'ArrowDown') onSlideStart();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') onSlideEnd();
  });
  window.addEventListener('mousedown', onJump);
  window.addEventListener('mouseup', onSlideEnd);
  window.addEventListener('touchstart', (e) => { e.preventDefault(); onJump(); }, { passive: false });
  window.addEventListener('touchend', onSlideEnd);

  animId = requestAnimationFrame(loop);
})();
