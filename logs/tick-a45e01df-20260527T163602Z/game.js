// Tumble Tunnel game implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 400);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Ball properties
  const ball = {
    x: width / 2,
    y: 50,
    r: 10,
    vx: 0,
    vy: 0,
    speed: 3,
  };
  const GRAVITY = 0.2;

  // Tunnel obstacles (bars) and collectable orbs
  const bars = []; // each {y, gapX, gapW, height}
  const orbs = []; // each {x, y, r, collected}
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // Input handling – left/right arrows or A/D keys
  const keys = {};
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', e => {
    resumeAudio();
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });
  // Simple tone generator
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollect() { playTone(800, 0.15); }
  function playCrash() { playTone(150, 0.4); }
  function playScore() { playTone(600, 0.1); }

  function spawnBar() {
    const gapW = 80; // width of gap
    const gapX = Math.random() * (width - gapW);
    const barHeight = 20;
    bars.push({ y: height, gapX, gapW, height: barHeight });
  }

  function spawnOrb() {
    const r = 5;
    const x = Math.random() * (width - r * 2) + r;
    const y = height + r;
    orbs.push({ x, y, r, collected: false });
  }

  function update() {
    if (gameOver) return;

    // Apply input
    if (keys.left) ball.vx = -ball.speed;
    else if (keys.right) ball.vx = ball.speed;
    else ball.vx = 0;

    // Physics
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Keep ball inside horizontal bounds
    if (ball.x - ball.r < 0) ball.x = ball.r;
    if (ball.x + ball.r > width) ball.x = width - ball.r;

    // Scroll tunnel upwards
    const scrollSpeed = 2;
    bars.forEach(bar => (bar.y -= scrollSpeed));
    orbs.forEach(orb => (orb.y -= scrollSpeed));

    // Remove off‑screen bars & orbs
    while (bars.length && bars[0].y + bars[0].height < 0) bars.shift();
    while (orbs.length && orbs[0].y + orbs[0].r < 0) orbs.shift();

    // Collision with bars
    for (const bar of bars) {
      const withinY = ball.y + ball.r > bar.y && ball.y - ball.r < bar.y + bar.height;
      if (withinY) {
        const inGap = ball.x > bar.gapX && ball.x < bar.gapX + bar.gapW;
        if (!inGap) {
          playCrash();
          gameOver = true;
          break;
        }
      }
    }

    // Collect orbs
    for (const orb of orbs) {
      if (!orb.collected) {
        const dx = ball.x - orb.x;
        const dy = ball.y - orb.y;
        if (dx * dx + dy * dy < (ball.r + orb.r) ** 2) {
          orb.collected = true;
          score++;
          playCollect();
        }
      }
    }

    // Lose if ball leaves canvas vertically
    if (ball.y - ball.r > height) gameOver = true;

    // Spawn new obstacles / orbs periodically
    if (frame % 120 === 0) spawnBar(); // every 2 seconds at 60fps
    if (frame % 180 === 0) spawnOrb(); // every 3 seconds

    frame++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e3a8a'); // dark blue top
    bgGrad.addColorStop(1, '#0f172a'); // darker bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw ball (gradient already applied in update)
    // (ball drawing handled earlier with gradient and shadow)

    // Draw bars with subtle gradient and slight rounding
    for (const bar of bars) {
      const barGrad = ctx.createLinearGradient(0, bar.y, 0, bar.y + bar.height);
      barGrad.addColorStop(0, '#444');
      barGrad.addColorStop(1, '#111');
      ctx.fillStyle = barGrad;
      // left piece
      ctx.fillRect(0, bar.y, bar.gapX, bar.height);
      // right piece
      ctx.fillRect(bar.gapX + bar.gapW, bar.y, width - (bar.gapX + bar.gapW), bar.height);
    }

    // Draw orbs with glow
    for (const orb of orbs) {
      if (!orb.collected) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,215,0,0.7)';
        ctx.shadowBlur = 12;
        const orbGrad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          orb.r / 4,
          orb.x,
          orb.y,
          orb.r
        );
        orbGrad.addColorStop(0, '#fff9c4');
        orbGrad.addColorStop(1, '#ffb300');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffeb3b';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

    // Draw orbs
    ctx.fillStyle = '#ffd700';
    for (const orb of orbs) {
      if (!orb.collected) {
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
