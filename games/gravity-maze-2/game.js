// Simple Gravity Maze game – enhanced graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  // Background gradient will be created after context
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  // Create background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, '#e0f7fa');
  bgGradient.addColorStop(1, '#80deea');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after user interaction
  window.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });
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
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ball state
  const ball = { x: 40, y: 40, r: 10, vx: 0, vy: 0 };
  // Gravity vector, changes with arrow keys
  const gravity = { x: 0, y: 0.2 };

  // Simple maze: array of wall segments {x1,y1,x2,y2}
  const walls = [
    // outer border
    {x1:0,y1:0, x2:W, y2:0},
    {x1:W,y1:0, x2:W, y2:H},
    {x1:W,y1:H, x2:0, y2:H},
    {x1:0,y1:H, x2:0, y2:0},
    // inner obstacles
    {x1:100,y1:0, x2:100, y2:200},
    {x1:100,y1:200, x2:300, y2:200},
    {x1:300,y1:200, x2:300, y2:400},
    {x1:300,y1:400, x2:150, y2:400},
    {x1:150,y1:400, x2:150, y2:250},
    // spike (danger zone) as a red square
    {x1:250,y1:250, x2:300, y2:250},
    {x1:300,y1:250, x2:300, y2:300},
    {x1:300,y1:300, x2:250, y2:300},
    {x1:250,y1:300, x2:250, y2:250},
  ];

  const spikeRegion = { x:250, y:250, w:50, h:50 };

  // Input handling – tilt with arrow keys
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; e.preventDefault(); });

  function updateGravity() {
    const speed = 0.2;
    gravity.x = 0; gravity.y = 0;
    if (keys['ArrowLeft']) gravity.x = -speed;
    if (keys['ArrowRight']) gravity.x = speed;
    if (keys['ArrowUp']) gravity.y = -speed;
    if (keys['ArrowDown']) gravity.y = speed;
  }

  function step() {
    updateGravity();
    // apply gravity
    ball.vx += gravity.x;
    ball.vy += gravity.y;
    // simple friction
    ball.vx *= 0.99;
    ball.vy *= 0.99;
    // move
    ball.x += ball.vx;
    ball.y += ball.vy;
    // collision with walls (basic circle-line)
    for (const w of walls) {
      // project ball center onto wall segment
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const len2 = dx*dx + dy*dy;
      let t = ((ball.x - w.x1)*dx + (ball.y - w.y1)*dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const closestX = w.x1 + t*dx;
      const closestY = w.y1 + t*dy;
      const distX = ball.x - closestX;
      const distY = ball.y - closestY;
      const dist2 = distX*distX + distY*distY;
      if (dist2 < ball.r*ball.r) {
        const dist = Math.sqrt(dist2) || 0.001;
        const nx = distX / dist;
        const ny = distY / dist;
        // push out of wall
        const overlap = ball.r - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;
        // reflect velocity
        const dot = ball.vx*nx + ball.vy*ny;
        ball.vx -= 2*dot*nx;
        ball.vy -= 2*dot*ny;
        // damp after bounce
        ball.vx *= 0.7; ball.vy *= 0.7;
        // play bounce sound
        playTone(300, 0.08);
      }
    }
    // check spike (lose condition)
    if (ball.x > spikeRegion.x && ball.x < spikeRegion.x+spikeRegion.w &&
        ball.y > spikeRegion.y && ball.y < spikeRegion.y+spikeRegion.h) {
      // play hit sound
      playTone(150, 0.4);
      alert('Game Over! You hit a spike.');
      // reset ball
      ball.x = 40; ball.y = 40; ball.vx = 0; ball.vy = 0;
    }
  }

  function draw() {
    // background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);
    // draw walls with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const w of walls) {
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
    }
    ctx.stroke();
    ctx.restore();
    // draw spikes as triangles
    ctx.fillStyle = 'darkred';
    ctx.beginPath();
    ctx.moveTo(spikeRegion.x, spikeRegion.y);
    ctx.lineTo(spikeRegion.x + spikeRegion.w, spikeRegion.y);
    ctx.lineTo(spikeRegion.x + spikeRegion.w/2, spikeRegion.y - 20);
    ctx.closePath();
    ctx.fill();
    // draw ball with radial gradient
    const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 2, ball.x, ball.y, ball.r);
    ballGrad.addColorStop(0, '#fff');
    ballGrad.addColorStop(1, '#2196F3');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fill();
  }

  function loop() {
    step();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
