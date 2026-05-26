// Minimal Neon Labyrinth Runner
// Canvas with id="game" must exist in the surrounding HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Simple sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type='sine', duration=0.1, volume=0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playMove() { playTone(400, 'triangle', 0.05, 0.05); }
  function playCollision() { playTone(150, 'sawtooth', 0.3, 0.5); }
  // Background ambient hum (looped)
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.value = 30; // low hum
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  // Player orb
  const player = { x: width / 2, y: height - 50, radius: 8, speed: 4 };

  // Maze line segments stored as {x1,y1,x2,y2}
  const lines = [];
  const lineSpacing = 50; // vertical distance between generated rows
  const lineLength = width; // full width lines with gaps
  const gapWidth = 80; // width of gap for orb to pass

  let lastLineY = 0;
  let score = 0;
  let alive = true;

  // Input handling
  const keys = {};
  let audioInitialized = false;
  function initAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!audioInitialized){
// bgOsc.start(); // Started on first input
      audioInitialized = true;
    }
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Initialize audio on first interaction
    initAudio();
    // Play move sound on directional input
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
      playMove();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function generateLine(y) {
    // Create a single horizontal line with a random gap
    const gapStart = Math.random() * (width - gapWidth);
    // left segment
    if (gapStart > 0) lines.push({ x1: 0, y1: y, x2: gapStart, y2: y });
    // right segment
    const gapEnd = gapStart + gapWidth;
    if (gapEnd < width) lines.push({ x1: gapEnd, y1: y, x2: width, y2: y });
  }

  function update(dt) {
    if (!alive) return;
    // Move player based on input
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    // Clamp
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));

    // Scroll lines downward
    const scrollSpeed = 100; // pixels per second
    lines.forEach(l => { l.y1 += scrollSpeed * dt; l.y2 += scrollSpeed * dt; });

    // Remove off‑screen lines
    while (lines.length && lines[0].y1 > height) lines.shift();

    // Generate new lines if needed
    if (lastLineY >= height) lastLineY = 0;
    while (lastLineY < height) {
      generateLine(lastLineY);
      lastLineY += lineSpacing;
    }

    // Collision detection (point‑to‑line distance)
    const collision = lines.some(l => {
      // since lines are horizontal, distance is vertical difference
      const dy = Math.abs(l.y1 - player.y);
      if (dy > player.radius) return false;
      // check if player's x is within the line segment's x range
      const withinX = player.x >= l.x1 && player.x <= l.x2;
      return withinX && dy < player.radius;
    });
    if (collision || player.y + player.radius > height) {
      playCollision();
      alive = false;
    }

    // Score – time survived
    score += dt;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw lines with neon glow
    ctx.lineWidth = 2;
    lines.forEach(l => {
      ctx.strokeStyle = '#0ff';
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    });
    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
    // Draw player with neon glow
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15;
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.radius * 0.2,
      player.x, player.y, player.radius * 2
    );
    playerGrad.addColorStop(0, '#ff0');
    playerGrad.addColorStop(1, '#550');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Reset shadow for subsequent drawings
    ctx.shadowBlur = 0;
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    if (alive) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
