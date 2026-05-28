// Neon Dodge game implementation
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});
  window.addEventListener('click', resumeAudio, {once: true});
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playSpawnSound() { playTone(300, 0.1); }
  function playScoreSound() { playTone(600, 0.05); }
  function playCollisionSound() { playTone(100, 0.4); }
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set a fixed canvas size (can be adjusted later)
  // Create background stars for a neon night sky effect
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  canvas.width = 400;
  canvas.height = 600;

  // Player configuration
  const player = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    color: '#00ffff', // neon cyan
  };

  // Circle (obstacle) configuration
  const circles = [];
  const baseSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let spawnInterval = baseSpawnInterval;

  let score = 0;
  let gameOver = false;
  let lastTime = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  function spawnCircle() {
    const radius = 15 + Math.random() * 10;
    const x = radius + Math.random() * (canvas.width - 2 * radius);
    const speed = 2 + Math.random() * 1.5 + score * 0.02; // increase speed with score
    const hue = Math.floor(Math.random() * 360);
    circles.push({ x, y: -radius, radius, speed, color: `hsl(${hue}, 80%, 60%)` });
    // Play spawn sound
    playSpawnSound();
  }

  function update(delta) {
    // Move player
    if (player.moveLeft) player.x -= player.speed;
    if (player.moveRight) player.x += player.speed;
    // Clamp within canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    // Spawn circles
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnCircle();
      lastSpawn = Date.now();
      // Gradually make spawning faster
      spawnInterval = Math.max(300, spawnInterval - 20);
    }

    // Update circles
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      // Move circle
      c.y += c.speed;
      // Add subtle horizontal drift for visual variety
      c.x += Math.sin(c.y * 0.05) * 0.5;
      // Remove off‑screen circles and increment score
      if (c.y - c.radius > canvas.height) {
        circles.splice(i, 1);
        score++;
        // Play score sound
        playScoreSound();
        continue;
      }
      // Collision detection (circle vs player rectangle)
      const closestX = Math.max(player.x, Math.min(c.x, player.x + player.width));
      const closestY = Math.max(player.y, Math.min(c.y, player.y + player.height));
      const dx = c.x - closestX;
      const dy = c.y - closestY;
      if (dx * dx + dy * dy < c.radius * c.radius) {
        // Play collision sound
        playCollisionSound();
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Clear and draw background gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background gradient (night sky)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#00060a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw player
    // Draw player with neon glow
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Reset shadow for subsequent drawings
    ctx.shadowBlur = 0;
    // Draw circles
    circles.forEach(c => {
      // Draw circle with neon glow
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
    });
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
