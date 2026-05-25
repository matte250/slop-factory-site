// Simple side‑scroll runner for canvas #game
// Ball jumps over gaps and spikes. The world scrolls leftwards.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize to fill container
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SCROLL_SPEED = 4;

  const player = { x: 80, y: 0, radius: 15, vy: 0, onGround: false };
  const platforms = [];
  const spikes = [];
  let gameOver = false;
  let frame = 0;
  const particles = []; // simple jump particles
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let gameOverSoundPlayed = false;
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playTone(300, 0.1);
  const playHit = () => playTone(100, 0.3);
  const playGameOver = () => playTone(50, 0.5);

  // Input
  const jump = () => {
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      // create simple particle burst
      particles.push({ x: player.x, y: player.y, vy: -2, alpha: 1, size: 4 });
      playJump();
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  // Helper to create platform
  const addPlatform = (x, w, y) => {
    platforms.push({ x, y, w, h: 20 });
  };
  // Helper to create spike (triangle)
  const addSpike = (x, y) => {
    spikes.push({ x, y, w: 20, h: 20 });
  };

  // Helper to draw rounded rectangle
  const drawRoundedRect = (x, y, w, h, r) => {
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
    ctx.fill();
  };

  // Initial platform
  addPlatform(0, canvas.width, canvas.height - 40);

  const update = () => {
    if (gameOver) return;
    frame++;
    // Move world left
    platforms.forEach(p => p.x -= SCROLL_SPEED);
    spikes.forEach(s => s.x -= SCROLL_SPEED);

    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;

    // Simple ground collision (last platform)
    player.onGround = false;
    for (const p of platforms) {
      if (
        player.x + player.radius > p.x &&
        player.x - player.radius < p.x + p.w &&
        player.y + player.radius > p.y &&
        player.y + player.radius < p.y + p.h &&
        player.vy >= 0
      ) {
        player.y = p.y - player.radius;
        player.vy = 0;
        player.onGround = true;
        break;
      }
    }

    // Spike collision (point inside triangle)
    for (const s of spikes) {
      const dx = player.x - (s.x + s.w / 2);
      const dy = player.y - s.y;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        gameOver = true;
        playHit();
      }
    }

    // Fell off screen
    if (player.y - player.radius > canvas.height) {
        gameOver = true;
        if (!gameOverSoundPlayed) {
          playGameOver();
          gameOverSoundPlayed = true;
        }
      }

    // Spawn new platforms/spikes every 120 frames
    if (frame % 120 === 0) {
      const gap = Math.random() * 80 + 40; // gap size
      const last = platforms[platforms.length - 1];
      const newX = last.x + last.w + gap;
      const platWidth = Math.random() * 120 + 80;
      const platY = canvas.height - 40 - Math.random() * 80;
      addPlatform(newX, platWidth, platY);
      // maybe add a spike on this platform
      if (Math.random() < 0.3) {
        const spikeX = newX + Math.random() * (platWidth - 20);
        addSpike(spikeX, platY - 20);
      }
    }

// Remove off‑screen objects
while (platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
while (spikes.length && spikes[0].x + spikes[0].w < 0) spikes.shift();
// Update particles
for (let i = particles.length - 1; i >= 0; i--) {
  const p = particles[i];
  p.y += p.vy;
  p.vy += 0.1;
  p.alpha -= 0.02;
  p.size *= 0.98;
  if (p.alpha <= 0) particles.splice(i, 1);
}
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#87CEEB');
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw platforms with rounded corners
    ctx.fillStyle = '#555';
    for (const p of platforms) {
      drawRoundedRect(p.x, p.y, p.w, p.h, 5);
    }

    // Draw spikes with gradient fill
    for (const s of spikes) {
      const spikeGrad = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
      spikeGrad.addColorStop(0, '#b00');
      spikeGrad.addColorStop(1, '#400');
      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    }

    // Draw player ball with radial gradient shading
    const grad = ctx.createRadialGradient(
      player.x - player.radius / 3,
      player.y - player.radius / 3,
      player.radius / 4,
      player.x,
      player.y,
      player.radius
    );
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Start game once the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
