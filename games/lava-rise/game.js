// Minimal "Lava Rise" endless arcade game
// Canvas with id="game" must exist in the HTML.

(() => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Adjust to canvas size (fallback to 400x600)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  const PLAYER_SIZE = 30;
  const PLAYER_SPEED = 4; // px per frame
  const LAVA_SPEED = 0.5; // px per frame
  const ORB_RADIUS = 8;
  const ORB_SPAWN = 2000; // ms

  let player = { x: canvas.width / 2 - PLAYER_SIZE / 2, y: canvas.height - PLAYER_SIZE - 10, w: PLAYER_SIZE, h: PLAYER_SIZE };
  let lavaHeight = 0; // grows upward from bottom
  let orbs = [];
  let particles = [];
  let score = 0;
  let lastOrb = 0;
  let gameOver = false;

  const keys = { left: false, right: false };
  let audioInitialized = false;
  window.addEventListener('keydown', e => {
    if (!audioInitialized) {
      audioCtx.resume();
      audioInitialized = true;
    }
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  function spawnOrb() {
    const x = Math.random() * (canvas.width - ORB_RADIUS * 2) + ORB_RADIUS;
    const y = canvas.height - lavaHeight - Math.random() * 150 - 50; // appear above lava
    orbs.push({ x, y, r: ORB_RADIUS, collected: false });
  }

  function update(delta) {
    if (gameOver) return;
    // Player movement
    if (keys.left) player.x -= PLAYER_SPEED;
    if (keys.right) player.x += PLAYER_SPEED;
    // Clamp
    player.x = Math.max(0, Math.min(canvas.width - PLAYER_SIZE, player.x));

    // Lava rises
    lavaHeight += LAVA_SPEED;
    const lavaTop = canvas.height - lavaHeight;

    // Generate lava particles
    // Spawn a few particles each frame for a spark effect
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.5) {
        particles.push({
          x: Math.random() * canvas.width,
          y: lavaTop,
          radius: Math.random() * 2 + 1,
          alpha: 0.8,
          speed: Math.random() * 0.5 + 0.2,
        });
      }
    }
    // Update particles: rise and fade
    particles = particles.map(p => ({
      ...p,
      y: p.y - p.speed,
      alpha: p.alpha - 0.02,
    })).filter(p => p.alpha > 0);

    // Lose condition
    if (player.y + player.h > lavaTop) {
      gameOver = true;
      playTone(200, 0.3); // game over sound
      return;
    }

    // Orb spawn timing
    if (performance.now() - lastOrb > ORB_SPAWN) {
      spawnOrb();
      lastOrb = performance.now();
    }

    // Check collisions with orbs
    for (const orb of orbs) {
      if (orb.collected) continue;
      const dx = (player.x + PLAYER_SIZE / 2) - orb.x;
      const dy = (player.y + PLAYER_SIZE / 2) - orb.y;
      const dist = Math.hypot(dx, dy);
      if (dist < PLAYER_SIZE / 2 + orb.r) {
        orb.collected = true;
        score++;
        playTone(660, 0.1); // orb collection sound
      }
    }
    // Remove collected / out‑of‑view orbs
    orbs = orbs.filter(o => !o.collected && o.y > lavaTop - o.r);
  }

  function draw() {
    // Background gradient (dark to lighter)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#444');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lava with gradient
    const lavaGradient = ctx.createLinearGradient(0, canvas.height - lavaHeight, 0, canvas.height);
    lavaGradient.addColorStop(0, '#ff6600'); // bright orange at top of lava
    lavaGradient.addColorStop(1, '#b33'); // dark red at bottom
    ctx.fillStyle = lavaGradient;
    const lavaTop = canvas.height - lavaHeight;
    ctx.fillRect(0, lavaTop, canvas.width, lavaHeight);

    // Lava particles (rising sparks)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 200, 0, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player with gradient and rounded corners
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#66f');
    playerGrad.addColorStop(1, '#009');
    ctx.fillStyle = playerGrad;
    const r = 6; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // Orbs (gold circles with gradient)
    for (const orb of orbs) {
      if (orb.collected) continue;
      const orbGrad = ctx.createRadialGradient(orb.x, orb.y, orb.r * 0.2, orb.x, orb.y, orb.r);
      orbGrad.addColorStop(0, '#ffecb3'); // bright center
      orbGrad.addColorStop(1, '#ff9800'); // outer
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  let last = performance.now();
  function loop(now) {
    const delta = now - last;
    last = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
