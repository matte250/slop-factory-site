// Simple endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size (portrait)
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player ship
  const player = {
    width: 30,
    height: 40,
    x: canvas.width / 2,
    y: canvas.height - 50,
    speed: 5,
    color: '#0ff',
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
  // Touch: move player to touch X
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    player.x = touch.clientX - rect.left;
  }, { passive: false });

  // Game objects
  const stars = [];
  const meteors = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  const spawnStar = () => {
    stars.push({
      x: Math.random() * canvas.width,
      y: -10,
      radius: 5,
      speed: 2 + Math.random() * 1,
      color: '#ff0',
    });
  };
  const spawnMeteor = () => {
    const size = 20 + Math.random() * 30;
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: 3 + Math.random() * 2,
      color: '#f44',
    });
  };

  const rectCollision = (a, b) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  };
  const circleRectCollision = (circle, rect) => {
    const distX = Math.abs(circle.x - rect.x - rect.width / 2);
    const distY = Math.abs(circle.y - rect.y - rect.height / 2);
    if (distX > rect.width / 2 + circle.radius) return false;
    if (distY > rect.height / 2 + circle.radius) return false;
    if (distX <= rect.width / 2) return true;
    if (distY <= rect.height / 2) return true;
    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  };

  const update = () => {
    if (gameOver) return;
    // Player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    // Spawn objects
    if (frame % 60 === 0) spawnStar(); // roughly 1 per second
    if (frame % 180 === 0) spawnMeteor(); // slower meteors

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y - s.radius > canvas.height) {
        stars.splice(i, 1);
        continue;
      }
      // collision with player
        if (circleRectCollision(s, player)) {
          // Play collect sound
          playSound(800, 'sine', 0.1);
          score += 1;
          stars.splice(i, 1);
        }
    }
    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (m.y - m.size > canvas.height) {
        meteors.splice(i, 1);
        continue;
      }
      // collision ends game
        if (rectCollision({ x: m.x, y: m.y, width: m.size, height: m.size }, player)) {
          // Play crash sound
          playSound(200, 'square', 0.3);
          gameOver = true;
        }
    }
    frame++;
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, type = 'sine', duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Ensure audio context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once:true});
  window.addEventListener('keydown', resumeAudio, {once:true});
  canvas.addEventListener('touchstart', resumeAudio, {once:true});

  const draw = () => {
    // Background gradient (space theme)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d'); // dark blue top
    bgGrad.addColorStop(1, '#000814'); // near black bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player ship as triangle
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.width / 2, player.y - player.height);
    ctx.lineTo(player.x + player.width, player.y);
    ctx.closePath();
    ctx.fill();

    // Draw stars with glow
    for (const s of stars) {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 2);
      grad.addColorStop(0, 'rgba(255,255,200,0.9)');
      grad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw meteors with gradient and rotation
    for (const m of meteors) {
      ctx.save();
      ctx.translate(m.x + m.size / 2, m.y + m.size / 2);
      ctx.rotate((m.y / canvas.height) * Math.PI / 6); // slight tilt as they fall
      ctx.translate(-m.size / 2, -m.size / 2);
      const mGrad = ctx.createLinearGradient(0, 0, m.size, m.size);
      mGrad.addColorStop(0, '#a00');
      mGrad.addColorStop(1, '#300');
      ctx.fillStyle = mGrad;
      ctx.fillRect(0, 0, m.size, m.size);
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
