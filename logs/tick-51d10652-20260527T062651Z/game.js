// Canvas Dodge game
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure AudioContext is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('click', resumeAudio);
  document.addEventListener('keydown', resumeAudio);
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Resize to displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const player = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 6,
    move: 0, // -1 left, 1 right, 0 none
  };

  const circles = [];
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  // Input handling (arrow keys and mouse)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.move = -1;
    else if (e.key === 'ArrowRight') player.move = 1;
  });
  document.addEventListener('keyup', (e) => {
    if ((e.key === 'ArrowLeft' && player.move === -1) || (e.key === 'ArrowRight' && player.move === 1)) {
      player.move = 0;
    }
  });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    player.x = Math.min(Math.max(mx - player.w / 2, 0), canvas.width - player.w);
  });

  function spawnCircle() {
    const radius = 10 + Math.random() * 10;
    circles.push({
      x: Math.random() * (canvas.width - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speed: 2 + Math.random() * 2,
    });
    // sound for new obstacle
    playTone(300, 0.05);
  }

  function update(delta) {
    if (gameOver) return;
    // Move player
    if (player.move !== 0) {
      player.x += player.move * player.speed;
      player.x = Math.min(Math.max(player.x, 0), canvas.width - player.w);
    }
    // Spawn circles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnCircle();
      lastSpawn = performance.now();
      // Gradually increase difficulty
      if (spawnInterval > 500) spawnInterval -= 50;
    }
    // Update circles
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += c.speed;
      // Remove off‑screen
      if (c.y - c.r > canvas.height) circles.splice(i, 1);
      else if (rectCircleCollide(player, c)) {
        // collision sound
        playTone(100, 0.2);
        gameOver = true;
        break;
      }
    }
    // Update score
    score = Math.floor((performance.now() - startTime) / 1000);
  }

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

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background gradient
    let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Player with rounded corners and shadow
    ctx.save();
    ctx.fillStyle = '#0a0';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    // rounded rect function
    function roundRect(x, y, w, h, r) {
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
    }
    roundRect(player.x, player.y, player.w, player.h, 4);
    ctx.fill();
    ctx.restore();
    // Circles with radial gradient and glow
    for (const c of circles) {
      const grad = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      grad.addColorStop(0, 'rgba(255, 100, 100, 0.9)');
      grad.addColorStop(1, 'rgba(150, 0, 0, 0.6)');
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // optional outer glow
      ctx.shadowColor = 'rgba(200, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(255, 150, 150, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  const startTime = performance.now();

  function loop() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
