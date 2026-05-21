// Simple Space Junk Cleanup game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Ship definition (triangle)
  const ship = {
    width: 40,
    height: 30,
    x: W / 2 - 20,
    y: H - 30,
    speed: 5,
  };

  const bullets = [];
  const junk = [];
  let leftPressed = false;
  let rightPressed = false;
  let canShoot = true;
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, type = 'sine', dur = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  // Ensure audio context is resumed on first user interaction
  document.addEventListener('click', () => audioCtx.resume(), { once: true });

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') leftPressed = true;
    if (e.code === 'ArrowRight') rightPressed = true;
    if (e.code === 'Space') {
      if (canShoot && !gameOver) {
        bullets.push({ x: ship.x + ship.width / 2 - 2, y: ship.y, w: 4, h: 10, speed: 7 });
        playSound(800, 'sawtooth', 0.08); // shoot sound
        canShoot = false;
        setTimeout(() => (canShoot = true), 200); // fire rate limit
      }
    }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') leftPressed = false;
    if (e.code === 'ArrowRight') rightPressed = false;
  });

  // Helper: rectangle collision
  const rectIntersect = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Spawn junk periodically
  const spawnJunk = () => {
    if (gameOver) return;
    const size = Math.random() * 20 + 10;
    junk.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
    });
    setTimeout(spawnJunk, Math.random() * 800 + 400);
  };
  spawnJunk();

  const update = () => {
    if (gameOver) return;
    // Move ship
    if (leftPressed) ship.x = Math.max(0, ship.x - ship.speed);
    if (rightPressed) ship.x = Math.min(W - ship.width, ship.x + ship.speed);

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Update junk
    for (let i = junk.length - 1; i >= 0; i--) {
      const j = junk[i];
      j.y += j.speed;
      // Collision with ship → game over
      if (rectIntersect(j, { x: ship.x, y: ship.y, w: ship.width, h: ship.height })) {
        // Play crash sound
        playSound(150, 'sine', 0.3);
        gameOver = true;
        break;
      }
      // Collision with bullets → destroy junk, increase score
      for (let k = bullets.length - 1; k >= 0; k--) {
        const b = bullets[k];
        if (rectIntersect(j, b)) {
          score += 10;
          // Play destroy sound
          playSound(300, 'triangle', 0.1);
          junk.splice(i, 1);
          bullets.splice(k, 1);
          break;
        }
      }
      // Remove off‑screen junk
      if (j.y > H) junk.splice(i, 1);
    }
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Bullets – small glowing rectangles
    bullets.forEach(b => {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#ffa');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    // Junk – circles with radial gradient
    junk.forEach(j => {
      const radGrad = ctx.createRadialGradient(
        j.x + j.w / 2,
        j.y + j.h / 2,
        j.w * 0.2,
        j.x + j.w / 2,
        j.y + j.h / 2,
        j.w / 2
      );
      radGrad.addColorStop(0, '#f88');
      radGrad.addColorStop(1, '#c00');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(j.x + j.w / 2, j.y + j.h / 2, j.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  const loop = () => {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
