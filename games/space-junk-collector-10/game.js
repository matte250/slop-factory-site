// Simple side‑scroller "Space Junk Collector"
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game state
  const player = { x: 50, y: height / 2, w: 30, h: 20, speed: 4 };
  let shields = 3;
  let score = 0;
  let gameOver = false;
  const junk = [];
  const asteroids = [];
  let frame = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawn() {
    // Spawn junk (green) every 80 frames
    if (frame % 80 === 0) {
      junk.push({ x: width, y: Math.random() * height, r: 8, speed: 2 });
    }
    // Spawn asteroid (red) every 150 frames
    if (frame % 150 === 0) {
      asteroids.push({ x: width, y: Math.random() * height, r: 12, speed: 3 });
    }
  }

  function update() {
    if (gameOver) return;
    // Player movement (W/S or ArrowUp/ArrowDown)
    if (keys.w || keys.ArrowUp) player.y -= player.speed;
    if (keys.s || keys.ArrowDown) player.y += player.speed;
    // Keep within canvas
    player.y = Math.max(0, Math.min(height - player.h, player.y));

    // Move junk & asteroids leftward
    junk.forEach(o => o.x -= o.speed);
    asteroids.forEach(o => o.x -= o.speed);

    // Collision detection
    junk.forEach((o, i) => {
if (circleRectCollide(o, player)) {
          score += 1;
          // Play collect sound
          playTone(600, 0.08);
          junk.splice(i, 1);
        } else if (o.x + o.r < 0) {
        junk.splice(i, 1);
      }
    });
    asteroids.forEach((o, i) => {
if (circleRectCollide(o, player)) {
          shields -= 1;
          // Play hit sound
          playTone(200, 0.2);
          asteroids.splice(i, 1);
          if (shields <= 0) {
            gameOver = true;
            // Play game over tone
            playTone(100, 0.5);
          }
      } else if (o.x + o.r < 0) {
        asteroids.splice(i, 1);
      }
    });
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, width, height);
    // Background: dark space with moving stars
    // Ensure star field exists
    if (!window.__stars) {
      const starCount = 100;
      window.__stars = [];
      for (let i = 0; i < starCount; i++) {
        window.__stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.5 + 0.2,
          alpha: Math.random() * 0.5 + 0.5,
        });
      }
    }
    // Update & draw stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    window.__stars.forEach(st => {
      st.x -= st.speed;
      if (st.x < 0) {
        st.x = width;
        st.y = Math.random() * height;
      }
      ctx.globalAlpha = st.alpha;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw player (simple triangle ship with slight gradient)
    const grad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, '#aaa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h / 2);
    ctx.lineTo(player.x + player.w, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    // Draw junk (glowing green hexagons)
    junk.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(frame * 0.02);
      const size = o.r;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      grad.addColorStop(0, 'rgba(0,255,0,0.8)');
      grad.addColorStop(1, 'rgba(0,64,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Draw asteroids (rocky with gradient)
    asteroids.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(frame * 0.01);
      const size = o.r;
      const grad = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size);
      grad.addColorStop(0, 'rgba(139,69,19,0.9)');
      grad.addColorStop(1, 'rgba(80,40,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      // jagged polygon (8 points)
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const radius = size * (0.7 + Math.random() * 0.3);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Shields: ${shields}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('GAME OVER', width / 2, height / 2);
    }
  }

  function loop() {
    frame++;
    spawn();
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Helper: circle‑rectangle collision
  function circleRectCollide(c, r) {
    const cx = c.x;
    const cy = c.y;
    const rx = r.x;
    const ry = r.y;
    const rw = r.w;
    const rh = r.h;
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < c.r * c.r;
  }

  // Start the game
  requestAnimationFrame(loop);
})();
