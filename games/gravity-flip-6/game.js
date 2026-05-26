// Gravity Flip game implementation
// Canvas with id="game" expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 400);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Game state
  const ball = { x: width / 2, y: height - 30, r: 12, vy: 0 };
  let gravity = 0.4; // positive → down, negative → up
  let gravitySign = 1;
  const platforms = [];
  const platformGap = 80;
  const platformHeight = 10;
  const spikeSize = 12;
  // generate simple star field
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  let gameOver = false;
  let frameCount = 0;

  // Initialize first platform at the bottom
  function addPlatform(y) {
    const gapX = Math.random() * (width - platformGap);
    platforms.push({ y, gapX, spikes: [] });
    // add a few spikes on the solid parts
    const spikeCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < spikeCount; i++) {
      // place spike on left or right side, avoiding the gap
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const x = side === 'left' ? Math.random() * platforms[platforms.length - 1].gapX :
        platforms[platforms.length - 1].gapX + platformGap + Math.random() * (width - platforms[platforms.length - 1].gapX - platformGap);
      platforms[platforms.length - 1].spikes.push({ x, y: y - spikeSize / 2 });
    }
  }

  // Populate initial platforms
  for (let y = height; y > -2000; y -= 100) addPlatform(y);

  // Sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Input handling with sound
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      // Ensure audio context is running (required by browsers)
      if (audioCtx.state === 'suspended') audioCtx.resume();
      gravitySign *= -1;
      playTone(440, 0.05); // flip sound
    }
  });

  function update() {
    if (gameOver) return;
    // Apply gravity
    ball.vy += gravity * gravitySign;
    ball.y += ball.vy;

    // Collision with platforms
    for (const p of platforms) {
      // Check if ball crosses platform from the direction of gravity
      const fromAbove = gravitySign > 0 && ball.vy > 0 && ball.y + ball.r >= p.y && ball.y - ball.r < p.y;
      const fromBelow = gravitySign < 0 && ball.vy < 0 && ball.y - ball.r <= p.y && ball.y + ball.r > p.y;
      if ((fromAbove || fromBelow) && ball.x < p.gapX || ball.x > p.gapX + platformGap) {
        // Land on platform (sound)
        ball.vy = 0;
        ball.y = gravitySign > 0 ? p.y - ball.r : p.y + ball.r;
        // play landing sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playTone(660, 0.05);
        break;
      }
    }

    // Collision with spikes
    for (const p of platforms) {
      for (const s of p.spikes) {
        const dx = ball.x - s.x;
        const dy = ball.y - s.y;
        if (Math.abs(dx) < spikeSize && Math.abs(dy) < spikeSize) {
          gameOver = true;
        }
      }
    }

    // Lose condition: ball leaves canvas
    if (ball.y - ball.r > height || ball.y + ball.r < 0) gameOver = true;

    // Scroll everything downwards to create upward motion
    for (const p of platforms) p.y += 1 * gravitySign; // move opposite to gravity direction
    // Remove off‑screen platforms and add new ones
    if (platforms[0].y > height + 20) platforms.shift();
    if (platforms[platforms.length - 1].y < -20) addPlatform(platforms[platforms.length - 1].y - 100);
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0d1b2a'); // dark night sky
    grad.addColorStop(1, '#1b263b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      ctx.fillRect(star.x, star.y, 1, 1);
    }

    // Draw ball with radial gradient for depth
    const ballGrad = ctx.createRadialGradient(ball.x - ball.r / 3, ball.y - ball.r / 3, ball.r / 5, ball.x, ball.y, ball.r);
    ballGrad.addColorStop(0, '#ff9e80');
    ballGrad.addColorStop(1, '#d84315');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // Draw platforms with a subtle color and slight shadow
    ctx.fillStyle = '#778899';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    for (const p of platforms) {
      // left solid part
      ctx.fillRect(0, p.y, p.gapX, platformHeight);
      // right solid part
      ctx.fillRect(p.gapX + platformGap, p.y, width - p.gapX - platformGap, platformHeight);
      // spikes (simple triangles with outline)
      ctx.fillStyle = '#c62828';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 2;
      for (const s of p.spikes) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - spikeSize / 2, s.y + spikeSize);
        ctx.lineTo(s.x + spikeSize / 2, s.y + spikeSize);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = '#778899';
    }
    ctx.shadowColor = 'transparent'; // reset shadow

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
