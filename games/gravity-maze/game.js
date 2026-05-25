// game.js – simple Gravity Maze prototype
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // --- Game state ----------------------------------------------------------
  const ball = { x: width / 2, y: height / 2, r: 8, vx: 0, vy: 0 };
  // Gravity direction: 0=down, 1=left, 2=up, 3=right (clockwise steps)
  let gravityDir = 0;
  const G = 0.3; // gravity magnitude

  // Simple static maze – walls are rectangles {x,y,w,h}
  const walls = [
    // border walls
    { x: 0, y: 0, w: width, h: 10 },
    { x: 0, y: height - 10, w: width, h: 10 },
    { x: 0, y: 0, w: 10, h: height },
    { x: width - 10, y: 0, w: 10, h: height },
    // inner obstacles (example)
    { x: 80, y: 60, w: 200, h: 10 },
    { x: 80, y: 60, w: 10, h: 120 },
    { x: 270, y: 60, w: 10, h: 120 },
    { x: 150, y: 150, w: 130, h: 10 },
  ];

  // Spikes – points that cause loss when ball touches them
  const spikes = [
    { x: 120, y: 120, r: 6 },
    { x: 240, y: 180, r: 6 },
  ];

  // Stars – collect to win (simple count)
  const stars = [
    { x: 50, y: 50, r: 5, collected: false },
    { x: 300, y: 130, r: 5, collected: false },
    { x: 200, y: 250, r: 5, collected: false },
  ];

  let collectedCount = 0;
  let gameOver = false;
  let win = false;

  // --- Audio ---------------------------------------------------------------
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

  // --- Helpers -------------------------------------------------------------
  function applyGravity() {
    // gravity vector based on direction
    const gx = (gravityDir === 1) ? -G : (gravityDir === 3) ? G : 0;
    const gy = (gravityDir === 0) ? G : (gravityDir === 2) ? -G : 0;
    ball.vx += gx;
    ball.vy += gy;
  }

  function moveBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;
    // simple friction / damping
    ball.vx *= 0.98;
    ball.vy *= 0.98;
  }

  function rectCollision(rect) {
    // Axis aligned bounding box collision with ball
    const nearestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    return (dx * dx + dy * dy) < (ball.r * ball.r);
  }

  function circleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const r = c1.r + c2.r;
    return (dx * dx + dy * dy) < (r * r);
  }

  function handleCollisions() {
    // walls – simple bounce
    for (const w of walls) {
      if (rectCollision(w)) {
        // reflect velocity based on which side collided (approximate)
        if (ball.x < w.x || ball.x > w.x + w.w) ball.vx = -ball.vx;
        if (ball.y < w.y || ball.y > w.y + w.h) ball.vy = -ball.vy;
        // push ball out of wall
        while (rectCollision(w)) {
          ball.x += Math.sign(ball.vx) * 0.5;
          ball.y += Math.sign(ball.vy) * 0.5;
        }
      }
    }

    // spikes – lose condition
    for (const s of spikes) {
      if (circleCollision(ball, s)) {
        gameOver = true;
        playTone(200, 0.3);
        return;
      }
    }

    // stars – collect
    for (const st of stars) {
      if (!st.collected && circleCollision(ball, st)) {
        st.collected = true;
        collectedCount++;
        if (collectedCount === stars.length) {
          win = true;
          playTone(800, 0.5);
        }
      }
    }

    // bounds – lose if ball leaves canvas
    if (ball.x < 0 || ball.x > width || ball.y < 0 || ball.y > height) {
      gameOver = true;
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#141424');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw walls with subtle stroke
    ctx.fillStyle = '#555';
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    for (const w of walls) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    // draw spikes (glowing red triangles)
    const spikeGrad = ctx.createLinearGradient(0, 0, width, 0);
    spikeGrad.addColorStop(0, '#ff6b6b');
    spikeGrad.addColorStop(1, '#ff3c3c');
    ctx.fillStyle = spikeGrad;
    for (const s of spikes) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.r);
      ctx.lineTo(s.x - s.r, s.y + s.r);
      ctx.lineTo(s.x + s.r, s.y + s.r);
      ctx.closePath();
      ctx.fill();
    }

    // draw stars with radial glow
    for (const st of stars) {
      if (st.collected) continue;
      const grad = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r * 3);
      grad.addColorStop(0, 'rgba(255,255,200,0.9)');
      grad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw ball with shadow and slight highlight
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'steelblue';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // overlay messages
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    } else if (win) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('You Win!', width / 2, height / 2);
    }
  }

  // --- Input ---------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    // ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (gameOver || win) return;
    switch (e.key) {
      case 'ArrowLeft':
        gravityDir = (gravityDir + 1) % 4; // rotate counter‑clockwise
        break;
      case 'ArrowRight':
        gravityDir = (gravityDir + 3) % 4; // rotate clockwise
        break;
    }
  });

  // --- Main loop -----------------------------------------------------------
  function loop() {
    if (!gameOver && !win) {
      applyGravity();
      moveBall();
      handleCollisions();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // start
  loop();
})();
