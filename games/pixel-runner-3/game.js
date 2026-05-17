// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  // ------- Graphic Enhancements -------
  // Gradient background colors
  const BG_TOP = '#0a0c33';
  const BG_BOTTOM = '#001133';
  // Player colors
  const PLAYER_COLOR = '#4CAF50'; // green
  const PLAYER_HEAD_COLOR = '#81C784';
  // Obstacle color (spikes)
  const OBSTACLE_COLOR = '#D32F2F';
  // Star color (gold)
  const STAR_COLOR = '#FFEB3B';
  // Particle color for collection effect
  const PARTICLE_COLOR = '#FFEB3B';
  // ------------------------------------
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function jumpSound() { playTone(300, 100); }
  function collectSound() { playTone(600, 80); }
  function gameOverSound() { playTone(150, 300); }
  // Fixed canvas size (can be changed via CSS)
  canvas.width = canvas.offsetWidth || 800;
  canvas.height = canvas.offsetHeight || 200;

  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 1200; // distance between obstacles
  const STAR_SIZE = 10;

  let speed = 4;
  let frameCount = 0;
  let score = 0;
  let gameOver = false;

  const player = {
    x: 50,
    y: canvas.height - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
    draw() {
      // Draw body
      ctx.fillStyle = PLAYER_COLOR;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // Simple head
      ctx.fillStyle = PLAYER_HEAD_COLOR;
      ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height / 2);
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.height >= canvas.height) {
        this.y = canvas.height - this.height;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
  };

  const obstacles = [];
  const stars = [];
  const particles = [];

  function spawnObstacle() {
    const height = Math.random() * 40 + 20;
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height,
      width: OBSTACLE_WIDTH,
      height,
    });
  }

  function spawnStar() {
    const y = Math.random() * (canvas.height - 60) + 20;
    stars.push({
      x: canvas.width,
      y,
      size: STAR_SIZE,
      collected: false,
    });
  }

  function rectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function update() {
    if (gameOver) return;
    frameCount++;

    // Increase speed gradually
    if (frameCount % 600 === 0) speed += 0.5;

    // Spawn obstacles and stars
    if (frameCount % Math.round(OBSTACLE_GAP / speed) === 0) spawnObstacle();
    if (frameCount % 150 === 0) spawnStar();

    // Update player
    player.update();

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // Collision
      if (rectCollision(player, o)) {
        gameOver = true;
      }
      // Remove off‑screen
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    // Update stars and spawn particles on collect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= speed;
      if (!s.collected && player.x < s.x + s.size && player.x + player.width > s.x && player.y < s.y + s.size && player.y + player.height > s.y) {
        s.collected = true;
        score += 10;
        collectSound();
        // create particles
        for (let p = 0; p < 8; p++) {
          particles.push({
            x: s.x + s.size / 2,
            y: s.y + s.size / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 30,
          });
        }
      }
      if (s.x + s.size < 0) stars.splice(i, 1);
    }
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, BG_TOP);
    grad.addColorStop(1, BG_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Ground strip
    ctx.fillStyle = '#555';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Draw stars (gold circles)
    ctx.fillStyle = STAR_COLOR;
    stars.forEach(s => {
      if (!s.collected) {
        ctx.beginPath();
        ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw obstacles (spikes)
    ctx.fillStyle = OBSTACLE_COLOR;
    obstacles.forEach(o => {
      ctx.beginPath();
      // simple triangle spike
      ctx.moveTo(o.x, o.y + o.height);
      ctx.lineTo(o.x + o.width / 2, o.y);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.closePath();
      ctx.fill();
    });

    // Draw player
    player.draw();

    // Draw particles (fade out)
    ctx.fillStyle = PARTICLE_COLOR;
    particles.forEach(p => {
      const alpha = Math.max(p.life / 30, 0);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling – space or click to jump
  function jump() {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state !== 'running') {
      audioCtx.resume();
    }
    if (player.onGround) {
      player.vy = JUMP_STRENGTH;
      player.onGround = false;
      jumpSound();
    }
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // Start the game loop
  requestAnimationFrame(loop);
})();
