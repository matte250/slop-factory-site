// Minimal Canvas Escape game
(function() {
  const canvas = document.getElementById('game');
  if (!canvas) return; // abort if canvas not present
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a simple tone
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }

  // Ensure audio context is resumed on first user interaction
  canvas.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, {once: true});

  // Player
  const player = {x: 50, y: HEIGHT - 30, w: 20, h: 20, vy: 0, onGround: true};
  const GRAVITY = 0.8;
  const JUMP_SPEED = -12;

  // Game objects
  const obstacles = [];
  const orbs = [];
  let frame = 0;
  let score = 0;
  let running = true;

  // Input
  canvas.addEventListener('click', () => {
    if (player.onGround) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      // Jump sound
      playTone(300, 120);
    }
  });

  function spawnObstacle() {
    const gap = Math.random() * 40 + 30; // gap width
    const height = Math.random() * 60 + 20; // obstacle height
    const type = Math.random() < 0.5 ? 'high' : 'low'; // high = block, low = slide under
    if (type === 'high') {
      obstacles.push({x: WIDTH, w: 30, y: HEIGHT - height, h: height});
    } else {
      obstacles.push({x: WIDTH, w: 30, y: HEIGHT - 10, h: 10}); // low bar to slide under, ignored in this simple version
    }
  }

  function spawnOrb() {
    const radius = 5;
    const y = Math.random() * (HEIGHT - 100) + 50;
    orbs.push({x: WIDTH, y, r: radius});
  }

  function update() {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= HEIGHT) {
      player.y = HEIGHT - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles & orbs
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      // Collision (simple AABB)
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        running = false;
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.x -= 4;
      // Collect
      const dx = (player.x + player.w/2) - orb.x;
      const dy = (player.y + player.h/2) - orb.y;
        if (Math.hypot(dx, dy) < orb.r + Math.min(player.w, player.h)/2) {
          score++;
          // Collect sound
          playTone(600, 80);
          orbs.splice(i, 1);
        } else if (orb.x + orb.r < 0) {
        orbs.splice(i, 1);
      }
    }

    // Spawn new obstacles/orbs
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 180 === 0) spawnOrb();
    frame++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#202040');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Player – draw as a circle with shadow
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = 'rgba(0,255,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Obstacles – red with slight gradient
    obstacles.forEach(o => {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#ff4444');
      obsGrad.addColorStop(1, '#aa0000');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Orbs – glowing radial gradient
    orbs.forEach(orb => {
      const orbGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      orbGrad.addColorStop(0, 'rgba(255,255,0,0.9)');
      orbGrad.addColorStop(1, 'rgba(255,255,0,0.1)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score – white with subtle shadow
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.restore();
  }

  let gameOverPlayed = false;
  function loop() {
    if (!running) {
      if (!gameOverPlayed) {
        // Game over sound
        playTone(100, 300);
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over - Score: ' + score, WIDTH/2-80, HEIGHT/2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
