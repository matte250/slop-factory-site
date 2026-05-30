// Pixel Runner – enhanced graphics
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Simple sound manager using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Ensure AudioContext is resumed on first user interaction
  function resumeAudio() { if (audioCtx.state !== 'running') audioCtx.resume(); }
  window.addEventListener('mousedown', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playTone(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    jump() { playTone(300, 'triangle', 0.08); },
    collect() { playTone(600, 'sine', 0.12); },
    gameOver() { playTone(150, 'sawtooth', 0.4); }
  };
  const width = (canvas.width = 800);
  const height = (canvas.height = 400);

  // Game parameters
  let speed = 2; // base scroll speed
  const gravity = 0.5;
  const jumpStrength = -10;
  let boostTimer = 0;
  let frames = 0;

  // Utility: draw rounded rectangle
  function roundRect(x, y, w, h, r = 4) {
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
    ctx.fill();
  }

  // Background stars for parallax effect
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    speed: 0.2 + Math.random() * 0.3
  }));

  function drawBackground() {
    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0d47a1'); // dark blue top
    grad.addColorStop(1, '#1976d2'); // lighter bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
  }

  // Player definition – now a circle
  const player = {
    x: 50,
    y: height - 30,
    r: 12,
    vy: 0,
    onGround: true,
    draw() {
      ctx.fillStyle = '#00ff88'; // bright teal
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += gravity;
      this.y += this.vy;
      if (this.y + this.r >= height) {
        this.y = height - this.r;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
jump() {
          if (this.onGround) {
            this.vy = jumpStrength;
            this.onGround = false;
            sounds.jump();
          }
        }
      };


  // Obstacles – spikes (triangles)
  const obstacles = [];
  const orbs = [];

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    const points = [
      { x: width, y: height },
      { x: width, y: height - size },
      { x: width + size, y: height }
    ];
    obstacles.push({ points, w: size, h: size });
  }

  function spawnOrb() {
    const size = 10;
    const yPos = height - 80 - Math.random() * 200;
    orbs.push({
      x: width,
      y: yPos,
      w: size,
      h: size,
      collected: false,
      glow: 0
    });
  }

  function rectCollide(a, b) {
    // Approximate player as bounding box for simplicity
    const pw = a.r * 2,
          ph = a.r * 2;
    return a.x - a.r < b.x + b.w && a.x + a.r > b.x && a.y - a.r < b.y + b.h && a.y + a.r > b.y;
  }

  let running = true;
  function gameOver() {
    running = false;
    sounds.gameOver();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', width / 2 - 80, height / 2);
  }

  function reset() {
    obstacles.length = 0;
    orbs.length = 0;
    player.x = 50;
    player.y = height - 30;
    player.vy = 0;
    speed = 2;
    boostTimer = 0;
    frames = 0;
    running = true;
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') player.jump();
    if (!running && e.code === 'Enter') reset();
  });
  canvas.addEventListener('mousedown', () => player.jump());

  function loop() {
    if (!running) return;
    drawBackground();

    // Update player
    player.update();
    player.draw();

    // Spawn obstacles and orbs
    if (frames % 120 === 0) spawnObstacle();
    if (frames % 300 === 0) spawnOrb();

    // Draw obstacles – triangles
    ctx.fillStyle = '#ff5722'; // vivid orange
    obstacles.forEach((o, i) => {
      o.points.forEach(p => p.x -= speed);
      ctx.beginPath();
      ctx.moveTo(o.points[0].x, o.points[0].y);
      ctx.lineTo(o.points[1].x, o.points[1].y);
      ctx.lineTo(o.points[2].x, o.points[2].y);
      ctx.closePath();
      ctx.fill();
      // Collision using bounding box approximation
      const bbox = { x: o.points[1].x, y: o.points[1].y - o.h, w: o.w, h: o.h };
      if (rectCollide(player, bbox)) return gameOver();
    });
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].points[0].x + obstacles[0].w < 0) obstacles.shift();

    // Draw orbs – glowing circles
    ctx.fillStyle = '#ffeb3b';
    orbs.forEach((orb, i) => {
      orb.x -= speed;
      if (!orb.collected) {
        // Glow effect
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.w + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.w, 0, Math.PI * 2);
        ctx.fill();
        if (rectCollide(player, orb)) {
          orb.collected = true;
          sounds.collect();
          boostTimer = 180;
        }
      }
    });
    // Cleanup off‑screen orbs
    while (orbs.length && orbs[0].x + orbs[0].w < 0) orbs.shift();

    // Speed boost handling
    if (boostTimer > 0) {
      speed = 4;
      boostTimer--;
    } else {
      speed = 2;
    }

    frames++;
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
