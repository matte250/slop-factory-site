// Simple endless runner targeting <canvas id="game"></canvas>
// Core concepts: player runs automatically, space = jump, ArrowDown = slide, random obstacles.
// Enhanced graphics: gradient sky, rounded player, shaded obstacles, ground line.

(() => {
  // Sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'square') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    jump: () => playTone(440), // A4
    slide: () => playTone(220),
    hit: () => playTone(100, 0.3, 'sawtooth'),
    // simple background loop (low hum)
    startMusic: () => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 60;
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      sounds._musicOsc = osc; // store to stop later
    },
    stopMusic: () => {
      if (sounds._musicOsc) sounds._musicOsc.stop();
    }
  };
  // start background music on user interaction
  let musicStarted = false;
  function ensureMusic() {
    // resume audio context (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (!musicStarted) {
      sounds.startMusic();
      musicStarted = true;
    }
  }

  // Rest of the original code...
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Helper: draw rounded rectangle
  function drawRoundedRect(x, y, w, h, r, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // Game state
  let speed = 4; // ground scroll speed
  let gravity = 0.5;
  let gameOver = false;

  // Player
  const player = {
    w: 40,
    h: 60,
    x: 80,
    y: H - 60, // ground position
    vy: 0,
    slide: false,
    update() {
      // Apply gravity
      this.vy += gravity;
      this.y += this.vy;
      // Ground collision
      if (this.y > H - this.h) {
        this.y = H - this.h;
        this.vy = 0;
      }
    },
    draw() {
      // rounded player with gradient fill
      const drawH = this.slide ? this.h / 2 : this.h;
      const drawY = this.slide ? this.y + this.h / 2 : this.y;
      const grad = ctx.createLinearGradient(this.x, drawY, this.x, drawY + drawH);
      grad.addColorStop(0, '#0b79d0');
      grad.addColorStop(1, '#74b9ff');
      drawRoundedRect(this.x, drawY, this.w, drawH, 6, grad);
    }
  };

  // Obstacles
  const obstacles = [];
  const obstacleTypes = [
    { w: 30, h: 50, color: '#3c3c3c' }, // cactus
    { w: 50, h: 30, color: '#555' },   // rock
    { w: 60, h: 20, color: '#777' }    // low bridge
  ];

  function spawnObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const o = {
      w: type.w,
      h: type.h,
      x: W,
      y: H - type.h,
      color: type.color,
      draw() { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.w, this.h); }
    };
    obstacles.push(o);
  }

  let spawnTimer = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      keys.jump = true;
      ensureMusic();
      sounds.jump();
    }
    if (e.code === 'ArrowDown') {
      keys.slide = true;
      ensureMusic();
      sounds.slide();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'Space') keys.jump = false;
    if (e.code === 'ArrowDown') keys.slide = false;
  });

  function handleInput() {
    if (keys.jump && player.vy === 0) {
      player.vy = -12; // jump impulse
    }
    player.slide = !!keys.slide;
  }

  function updateObstacles() {
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 60 + Math.random() * 60; // 1-2 seconds at 60fps
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
  }

  function checkCollisions() {
    const pRect = {
      x: player.x,
      y: player.slide ? player.y + player.h / 2 : player.y,
      w: player.w,
      h: player.slide ? player.h / 2 : player.h
    };
    for (const o of obstacles) {
      const oRect = { x: o.x, y: o.y, w: o.w, h: o.h };
      if (pRect.x < oRect.x + oRect.w &&
          pRect.x + pRect.w > oRect.x &&
          pRect.y < oRect.y + oRect.h &&
          pRect.y + pRect.h > oRect.y) {
        gameOver = true;
        break;
      }
    }
  }

  function clear() {
    // Draw sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue top
    skyGrad.addColorStop(1, '#b0e0e6'); // pale blue bottom
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // ground line
    ctx.fillStyle = '#444';
    ctx.fillRect(0, H - 2, W, 2);
  }

  function drawObstacles() {
    for (const o of obstacles) o.draw();
  }

  function loop() {
    if (gameOver) {
      // play hit sound and stop music once
      sounds.hit();
      sounds.stopMusic();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      return;
    }
    clear();
    handleInput();
    player.update();
    updateObstacles();
    checkCollisions();
    player.draw();
    drawObstacles();
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
