// Simple Lava Escape game with enhanced graphics
// Canvas with id="game" assumed in HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context resumes after first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});
  window.addEventListener('click', resumeAudio, {once: true});
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const player = { x: width / 2, y: height - 30, w: 20, h: 20, speed: 4 };
  let lavaY = height; // starts off-screen bottom
  let lavaSpeed = 0.3;
  let air = 10; // seconds of air
  const bubbles = [];
  let lastBubble = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBubble() {
    const radius = 8;
    const x = Math.random() * (width - radius * 2) + radius;
    const y = Math.random() * (lavaY - 100) + 50; // stay above lava
    bubbles.push({ x, y, radius, collected: false });
  }

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Lava rise
    lavaY -= lavaSpeed * dt;
    lavaSpeed += 0.00002 * dt; // accelerate

    // Air consumption
    air -= dt / 1000;

    // Bubble spawning
    if (performance.now() - lastBubble > 2000) {
      spawnBubble();
      lastBubble = performance.now();
    }
    // Check bubble collection
    for (const b of bubbles) {
      if (!b.collected) {
        const dx = b.x - (player.x + player.w / 2);
        const dy = b.y - (player.y + player.h / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < b.radius + Math.max(player.w, player.h) / 2) {
          b.collected = true;
          air += 3; // add 3 seconds
          playTone(600, 0.1); // bubble collect sound
        }
      }
    }
  }

  function draw() {
    // Background gradient (dark sky)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1a001a');
    bgGrad.addColorStop(1, '#330033');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Lava gradient (glowing bottom)
    const lavaGrad = ctx.createLinearGradient(0, lavaY, 0, height);
    lavaGrad.addColorStop(0, '#ff4500');
    lavaGrad.addColorStop(1, '#8b0000');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, lavaY, width, height - lavaY);
    // Add subtle lava glow
    ctx.shadowColor = 'rgba(255,69,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillRect(0, lavaY, width, height - lavaY);
    ctx.shadowBlur = 0; // reset

    // Player – circular avatar with gradient
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      2,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w
    );
    playerGrad.addColorStop(0, '#00ffff');
    playerGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles – light radial gradient with slight glow
    for (const b of bubbles) {
      if (!b.collected) {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        grad.addColorStop(0, 'rgba(173,216,230,0.9)');
        grad.addColorStop(1, 'rgba(173,216,230,0.2)');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(173,216,230,0.5)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // HUD – bright text with subtle shadow
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.font = '16px sans-serif';
    ctx.fillText(`Air: ${air.toFixed(1)}s`, 10, 20);
    ctx.shadowBlur = 0; // reset for future draws
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Background lava rumble loop
  let rumbleInterval = setInterval(() => playTone(150, 0.2), 2000);

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    // Lose condition
    if (air <= 0 || lavaY <= player.y + player.h) {
      // Stop background rumble
      clearInterval(rumbleInterval);
      // Play game over sound
      playTone(200, 0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
