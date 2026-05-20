// Simple endless runner with enhanced graphics for canvas#game
// Controls: Space to jump, ArrowDown to slide (optional).
// Visuals: gradient sky, ground line, rounded/colored obstacles, animated runner, sparkling stars.
// Score displayed top‑left; speed increases every 5 seconds.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800);
  const H = (canvas.height = 200);

  // Audio setup
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
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player
  const player = { x: 50, y: H - 40, w: 30, h: 40, vy: 0, onGround: true };
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;

  // Game state
  let obstacles = [];
  let stars = [];
  let frame = 0;
  let speed = 3;
  let score = 0;
  let gameOver = false;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space' && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
    if (e.code === 'ArrowDown') {
      keys.slide = true;
      playTone(220, 0.05); // slide sound
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') keys.slide = false;
  });

  function spawnObstacle() {
    const height = 30 + Math.random() * 30;
    obstacles.push({ x: W, y: H - height, w: 20, h: height });
  }
  function spawnStar() {
    const size = 6;
    stars.push({ x: W, y: 20 + Math.random() * (H - 40), r: size });
  }

  function update() {
    if (gameOver) return;
    frame++;
    // speed increase
    if (frame % (5 * 60) === 0) speed += 0.5;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= H - player.h) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // spawn obstacles / stars
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 150 === 0) spawnStar();

    // move obstacles
    obstacles.forEach(o => (o.x -= speed));
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // move stars
    stars.forEach(s => (s.x -= speed));
    stars = stars.filter(s => s.x + s.r > 0);

    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        playTone(150, 0.3); // collision sound
      }
    }
    // collect stars
    stars = stars.filter(s => {
      const hit =
        player.x < s.x + s.r &&
        player.x + player.w > s.x - s.r &&
        player.y < s.y + s.r &&
        player.y + player.h > s.y - s.r;
      if (hit) score++;
      return !hit;
    });
  }

  function draw() {
    // Sky gradient background
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#87ceeb'); // light blue
    sky.addColorStop(1, '#4682b4'); // deeper blue
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Ground strip
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - 20, W, 20);

    // Player (simple animated runner)
    ctx.fillStyle = '#09f';
    // body
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // legs animation: alternate each 15 frames
    const legOffset = Math.floor(frame / 15) % 2 ? 2 : -2;
    ctx.fillStyle = '#066';
    ctx.fillRect(player.x + 5, player.y + player.h, 5, 10 + legOffset);
    ctx.fillRect(player.x + player.w - 10, player.y + player.h, 5, 10 - legOffset);

    // Obstacles (rounded rectangles with gradient)
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#e74c3c');
      grad.addColorStop(1, '#c0392b');
      ctx.fillStyle = grad;
      // rounded rect path
      const radius = 5;
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
    });

    // Stars (sparkling with radial gradient)
    stars.forEach(s => {
      const starGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      starGrad.addColorStop(0, '#fffacd');
      starGrad.addColorStop(1, '#f1c40f');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
