// Simple "Pixel Storm" game implementation
// Canvas with id="game" is expected in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id="game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size (adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Create simple starfield for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playEMP() { playTone(400, 0.1); }
  function playCrash() { playTone(150, 0.3); }

  // ----- Game objects -----
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  const blocks = []; // falling pixel blocks
  const blockSize = 20;
  const blockSpeed = 2;
  const blockSpawnInterval = 1000; // ms

  let lastBlockSpawn = 0;
  let emp = null; // active EMP effect
  const empRadius = 50;
  const empDuration = 200; // ms

  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') fireEMP();
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });

  function fireEMP() {
    if (emp && Date.now() - emp.start < empDuration) return; // already active
    emp = { x: ship.x + ship.width / 2, y: ship.y, start: Date.now() };
    // Play EMP sound
    playEMP();
    // Clear nearby blocks immediately
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      const dx = b.x + blockSize / 2 - emp.x;
      const dy = b.y + blockSize / 2 - emp.y;
      if (Math.hypot(dx, dy) < empRadius) blocks.splice(i, 1);
    }
  }

  // ----- Game loop -----
  function update(delta) {
    if (gameOver) return;
    // ship movement
    if (keys.left) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.right) ship.x = Math.min(canvas.width - ship.width, ship.x + ship.speed);

    // spawn blocks
    if (Date.now() - lastBlockSpawn > blockSpawnInterval) {
      const x = Math.random() * (canvas.width - blockSize);
      blocks.push({ x, y: -blockSize });
      lastBlockSpawn = Date.now();
    }

    // update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += blockSpeed;
      // collision with ship
      if (
        b.x < ship.x + ship.width &&
        b.x + blockSize > ship.x &&
        b.y < ship.y + ship.height &&
        b.y + blockSize > ship.y
      ) {
        gameOver = true; playCrash();
      }
      // remove off‑screen blocks
      if (b.y > canvas.height) blocks.splice(i, 1);
    }
  }

function draw() {
    // Clear and draw starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw ship as a triangle with a slight glow
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,170,255,0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // draw blocks with a subtle red gradient
    for (const b of blocks) {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x + blockSize, b.y + blockSize);
      grad.addColorStop(0, '#ff5555');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, blockSize, blockSize);
    }

    // draw EMP as a radial gradient pulse
    if (emp && Date.now() - emp.start < empDuration) {
      const grad = ctx.createRadialGradient(emp.x, emp.y, 0, emp.x, emp.y, empRadius);
      grad.addColorStop(0, 'rgba(0,255,255,0.6)');
      grad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(emp.x, emp.y, empRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

    // draw EMP if active
    if (emp && Date.now() - emp.start < empDuration) {
      ctx.beginPath();
      ctx.arc(emp.x, emp.y, empRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
