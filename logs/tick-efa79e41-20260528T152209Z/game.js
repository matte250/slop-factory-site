// Canvas Dodge game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Initialize background stars
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const player = {
    w: 30,
    h: 30,
    x: canvas.width / 2 - 15,
    y: canvas.height - 40,
    speed: 5,
    color: '#0af',
    move(dx) {
      this.x = Math.max(0, Math.min(canvas.width - this.w, this.x + dx));
    }
  };

  const circles = [];
  const stars = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms
  let gameOver = false;
  let score = 0;

  function spawnCircle() {
    const radius = 15 + Math.random() * 10;
    circles.push({
      x: Math.random() * (canvas.width - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speed: 2 + Math.random() * 2,
    });
  }

  function update(dt) {
    // animate stars twinkling
    for (const s of stars) {
      s.phase += 0.02;
      s.r = 1 + Math.sin(s.phase) * 0.5;
    }
    if (gameOver) return;
    // spawn
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnCircle();
      lastSpawn = performance.now();
    }
    // move circles
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += c.speed;
      if (c.y - c.r > canvas.height) {
        circles.splice(i, 1);
        score++;
        playTone(400, 0.08); // point sound
      } else if (rectCircleCollide(player, c)) {
        gameOver = true;
        playTone(100, 0.5); // collision/game over sound
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars (background)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // player
    // draw player with rounded gradient
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#0af');
    playerGrad.addColorStop(1, '#005');
    ctx.fillStyle = playerGrad;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // circles with radial gradient
    for (const c of circles) {
      const grad = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      grad.addColorStop(0, 'rgba(255,80,80,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score / game over text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      player.move(-player.speed);
      playTone(200, 0.05);
    } else if (e.key === 'ArrowRight') {
      player.move(player.speed);
      playTone(200, 0.05);
    }
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    player.x = Math.max(0, Math.min(canvas.width - player.w, mx - player.w / 2));
  });

  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - (rect.x + rect.w / 2));
    const distY = Math.abs(circle.y - (rect.y + rect.h / 2));
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  requestAnimationFrame(loop);
})();
