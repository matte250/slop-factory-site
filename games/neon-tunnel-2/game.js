// Neon Tunnel game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 800);
  const h = (canvas.height = canvas.clientHeight || 600);
  const centerX = w / 2;
  // Trail of recent player positions for motion blur effect
  const playerTrail = []; // {x, y}


  // Player (glowing dot)
  const player = {
    x: 0,
    y: h * 0.8,
    radius: 8,
    speed: 6,
    direction: 0, // -1 left, 1 right, 0 straight
    color: '#0ff',
    // radial gradient for neon effect, created in draw
  };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  let lastDirection = 0; // track previous direction for sound triggers

  // Obstacles – rotating bars
  const bars = [];
  const barSpacing = 120; // distance between bars
  const barWidth = 8;
  const barLength = 200;
  const rotateSpeed = 0.02; // rad/frame
  // Starfield for background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * w - w / 2,
      y: Math.random() * h - h / 2,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  let distance = 0; // score
  let lastBarY = -barSpacing;
  let running = true;

  // Input handling (keyboard arrows / touch)
  const setDirection = (dir) => {
    if (dir !== lastDirection) {
      // Play tone for direction change: left lower pitch, right higher pitch
      if (dir === -1) playTone(400, 0.1);
      else if (dir === 1) playTone(800, 0.1);
    }
    lastDirection = dir;
    player.direction = dir;
  };
  window.addEventListener('keydown', (e) => {
    // Ensure audio context is running on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') setDirection(-1);
    else if (e.key === 'ArrowRight') setDirection(1);
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setDirection(0);
  });
  // Simple tap zones for mobile
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    setDirection(x < w / 2 ? -1 : 1);
  });
  canvas.addEventListener('touchend', () => setDirection(0));

  function addBar(y) {
    bars.push({ y, angle: 0 });
  }

  function update() {
    // Move player
    player.x += player.direction * player.speed;
    // Keep within bounds
    const maxX = w / 2 - player.radius;
    if (player.x > maxX) player.x = maxX;
    if (player.x < -maxX) player.x = -maxX;

    // Add new bars as we move forward
    if (distance - lastBarY >= barSpacing) {
      addBar(distance - h / 2);
      lastBarY = distance;
    }

    // Update bars
    for (const bar of bars) {
      bar.angle += rotateSpeed;
    }

    // Remove passed bars
    while (bars.length && bars[0].y < distance - h) bars.shift();
  }

  function draw() {
    // Clear and draw background gradient
    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    // Draw starfield with twinkling effect
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 4;
    for (const star of stars) {
      // Slightly vary alpha each frame for twinkle
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.save();
    ctx.translate(centerX, h);
    // Draw neon bars with gradient glow
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = barWidth;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 20;
    ctx.globalCompositeOperation = 'lighter';
    for (const bar of bars) {
      const relY = bar.y - distance;
      ctx.save();
      ctx.translate(0, relY);
      ctx.rotate(bar.angle);
      ctx.beginPath();
      ctx.moveTo(-barLength / 2, 0);
      ctx.lineTo(barLength / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
    // Motion blur trail for player
    playerTrail.push({ x: player.x, y: player.y });
    if (playerTrail.length > 12) playerTrail.shift();
    for (let i = 0; i < playerTrail.length; i++) {
      const t = playerTrail[i];
      const alpha = (i + 1) / playerTrail.length * 0.4;
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, -t.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw player dot with radial gradient on top
    const grad = ctx.createRadialGradient(player.x, -player.y, 0, player.x, -player.y, player.radius * 2);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#001');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(player.x, -player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 30);
  }


  function checkCollision() {
    for (const bar of bars) {
      const relY = bar.y - distance;
      // Approximate collision: if bar is near player's y position
      if (Math.abs(relY) < player.radius + barWidth) {
        // Compute distance from player.x to bar line (which is horizontal after rotation)
        const dx = player.x;
        const rotatedX = dx * Math.cos(-bar.angle) - (relY) * Math.sin(-bar.angle);
        if (Math.abs(rotatedX) < barLength / 2 + player.radius) {
          return true;
        }
      }
    }
    return false;
  }

  function loop(timestamp) {
    if (!running) return;
    distance += 2; // forward speed
    update();
    if (checkCollision()) {
      // Play collision sound
      playTone(150, 0.3);
      running = false;
      ctx.fillStyle = '#f44';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', centerX - 100, h / 2);
      return;
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
