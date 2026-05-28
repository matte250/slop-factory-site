// Simple endless runner based on IDEA.md
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 400;

  // Audio setup using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();

  // Utility to play a simple tone
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.1);
    }, duration * 1000);
  }

  function playJumpSound() { playTone(440, 0.08); }
  function playSlideSound() { playTone(220, 0.12, 'square'); }
  function playGameOverSound() { playTone(100, 0.3, 'sawtooth'); }

  // Player definition
  // Player definition with neon glow
  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: height - 30,
    vy: 0,
    gravity: 0.8,
    jumpStrength: -15,
    slide: false,
    update() {
      if (!this.slide) this.y += this.vy;
      this.vy += this.gravity;
      // ground collision
      if (this.y > height - this.h) {
        this.y = height - this.h;
        this.vy = 0;
      }
    },
    draw() {
      // Neon cyan rectangle with glow
      ctx.save();
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#0ff';
      ctx.fillRect(this.x, this.y, this.w, this.slide ? this.h / 2 : this.h);
      ctx.restore();
    }
  };

  // Draw obstacle with neon style
  function drawObstacle(o) {
    ctx.save();
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#f00';
    if (o.type === 'spike') {
      // draw triangle spike
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    } else {
      // block
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.restore();
  }

  // Obstacles
  const obstacles = [];
  const obstacleSpeed = 5;
  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'block' : 'spike';
    const w = 30;
    const h = type === 'block' ? 30 : 20;
    const y = type === 'block' ? height - h : height - h;
    obstacles.push({ x: width, y, w, h, type });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.code === 'Space' && player.vy === 0) {
      player.vy = player.jumpStrength;
      playJumpSound();
    }
    if (e.code === 'ArrowDown') {
      player.slide = true;
      playSlideSound();
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') {
      player.slide = false;
    }
    keys[e.code] = false;
  });

  let frame = 0;
  let running = true;
  function loop() {
    if (!running) return;
    // Draw background gradient (dark neon vibe)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Update and draw player
    player.update();
    player.draw();

    // Spawn obstacles occasionally
    if (frame % 100 === 0) spawnObstacle();

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Draw obstacle with neon style
      drawObstacle(o);
      // Collision detection
      const px = player.x;
      const py = player.y + (player.slide ? player.h / 2 : 0);
      const ph = player.slide ? player.h / 2 : player.h;
        if (px < o.x + o.w && px + player.w > o.x && py < o.y + o.h && py + ph > o.y) {
          running = false;
          playGameOverSound();
          ctx.fillStyle = '#fff';
          ctx.font = '48px sans-serif';
          ctx.fillText('Game Over', width / 2 - 120, height / 2);
        }
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Simple ground line
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();

    frame++;
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
