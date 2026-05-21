// Simple endless runner based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Graphics enhancements: background gradient, ball radial gradient, floor/ceiling gradient, spike stroke

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // Audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playToggle = () => playTone(440, 0.1);
  const playSpike = () => playTone(220, 0.2);
  const playGameOver = () => playTone(110, 0.5);

  const BALL_RADIUS = 12;
  const BALL_X = 80; // fixed horizontal position
  const GRAVITY_FORCE = 0.4;
  const SPEED = 3; // scroll speed
  const FLOOR_HEIGHT = 30;

  let gravity = 1; // 1 = down, -1 = up (toggle on click)
  let ballY = H / 2;
  let vy = 0;
  let scrollX = 0; // world offset
  let tiles = []; // {type: 'floor'|'gap'|'spike', x: number}
  let score = 0;
  let gameOver = false;

  // initial tiles to fill screen
  const TILE_W = 40;
  for (let i = 0; i < Math.ceil(W / TILE_W) + 2; i++) {
    tiles.push({type: 'floor', x: i * TILE_W});
  }

  function toggleGravity() {
    if (!audioInitialized) {
      audioCtx.resume();
      audioInitialized = true;
    }
    playToggle();
    gravity = -gravity;
  }
  canvas.addEventListener('click', toggleGravity);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); toggleGravity(); }, {passive:false});

  function addTile() {
    // random tile type with simple probabilities
    const rnd = Math.random();
    let type = 'floor';
    if (rnd < 0.2) type = 'gap';
    else if (rnd < 0.35) type = 'spike';
    const lastX = tiles.length ? tiles[tiles.length - 1].x : 0;
    tiles.push({type, x: lastX + TILE_W});
  }

  function update() {
    if (gameOver) return;

    // physics
    vy += gravity * GRAVITY_FORCE;
    ballY += vy;

    // keep ball within world bounds (avoid drifting off screen when not on platform)
    if (ballY > H - BALL_RADIUS) { ballY = H - BALL_RADIUS; vy = 0; }
    if (ballY < BALL_RADIUS) { ballY = BALL_RADIUS; vy = 0; }

    // scroll world
    scrollX -= SPEED;
    score += SPEED;

    // remove passed tiles
    while (tiles.length && tiles[0].x + scrollX < -TILE_W) tiles.shift();
    // add new tiles to keep ahead
    while (tiles.length && tiles[tiles.length - 1].x + scrollX < W + TILE_W) addTile();

    // collision with current tile under ball
    const worldBallX = BALL_X - scrollX; // translate to world coords
    const tileIdx = Math.floor(worldBallX / TILE_W);
    const tile = tiles[tileIdx];
    if (tile) {
      if (tile.type === 'gap') {
        // ball will fall through; nothing special needed – physics already applies
      } else if (tile.type === 'floor') {
        if (gravity > 0) { // floor is at bottom
          const floorY = H - FLOOR_HEIGHT;
          if (ballY + BALL_RADIUS > floorY) {
            ballY = floorY - BALL_RADIUS;
            vy = 0;
          }
        } else { // ceiling
          const ceilY = FLOOR_HEIGHT;
          if (ballY - BALL_RADIUS < ceilY) {
            ballY = ceilY + BALL_RADIUS;
            vy = 0;
          }
        }
      } else if (tile.type === 'spike') {
        // spike is a triangle pointing from floor or ceiling depending on gravity
        const spikeBaseY = gravity > 0 ? H - FLOOR_HEIGHT : FLOOR_HEIGHT;
        const spikeTipY = gravity > 0 ? spikeBaseY - TILE_W : spikeBaseY + TILE_W;
        const spikeX = tile.x + scrollX;
        // simple hit test: if ball center is inside triangle bounding box
        if (Math.abs(BALL_X - (tile.x + scrollX + TILE_W/2)) < BALL_RADIUS &&
            ((gravity > 0 && ballY > spikeBaseY - BALL_RADIUS) || (gravity < 0 && ballY < spikeBaseY + BALL_RADIUS))) {
          playSpike();
          gameOver = true;
        }
      }
    }

    // lose if ball hits top/bottom without platform
    if (ballY - BALL_RADIUS <= 0 || ballY + BALL_RADIUS >= H) {
      gameOver = true;
    }

    draw();
    if (!gameOver) requestAnimationFrame(update);
    else drawGameOver();
  }

  function draw() {
    // background gradient (sky to ground)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87CEEB'); // light sky
    bgGrad.addColorStop(1, '#1e90ff'); // deeper sky
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // draw floor / ceiling with subtle gradient
    const floorGrad = ctx.createLinearGradient(0, H - FLOOR_HEIGHT, 0, H);
    floorGrad.addColorStop(0, '#555');
    floorGrad.addColorStop(1, '#222');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, H - FLOOR_HEIGHT, W, FLOOR_HEIGHT);
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_HEIGHT);
    ceilGrad.addColorStop(0, '#555');
    ceilGrad.addColorStop(1, '#222');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, W, FLOOR_HEIGHT);

    // draw tiles (spikes)
    tiles.forEach(t => {
      const x = t.x + scrollX;
      if (t.type === 'gap') {
        // transparent gap
      } else if (t.type === 'spike') {
        // spike gradient fill
        const spikeGrad = ctx.createLinearGradient(x, gravity > 0 ? H - FLOOR_HEIGHT : FLOOR_HEIGHT,
                                                x + TILE_W, gravity > 0 ? H - FLOOR_HEIGHT - TILE_W : FLOOR_HEIGHT + TILE_W);
        spikeGrad.addColorStop(0, '#ff6666');
        spikeGrad.addColorStop(1, '#b20000');
        ctx.fillStyle = spikeGrad;
        ctx.beginPath();
        if (gravity > 0) {
          // spikes from floor upward
          ctx.moveTo(x, H - FLOOR_HEIGHT);
          ctx.lineTo(x + TILE_W / 2, H - FLOOR_HEIGHT - TILE_W);
          ctx.lineTo(x + TILE_W, H - FLOOR_HEIGHT);
        } else {
          // spikes from ceiling downward
          ctx.moveTo(x, FLOOR_HEIGHT);
          ctx.lineTo(x + TILE_W / 2, FLOOR_HEIGHT + TILE_W);
          ctx.lineTo(x + TILE_W, FLOOR_HEIGHT);
        }
        ctx.closePath();
        ctx.fill();
        // outline for contrast
        ctx.strokeStyle = '#880000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // draw ball with radial gradient
    const ballGrad = ctx.createRadialGradient(BALL_X, ballY, BALL_RADIUS * 0.2, BALL_X, ballY, BALL_RADIUS);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.5, '#00ffff');
    ballGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(BALL_X, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // draw score
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 10), 10, 20);
  }

  function drawGameOver() {
    // Ensure audio context is running
    if (!audioInitialized) {
      audioCtx.resume();
      audioInitialized = true;
    }
    playGameOver();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, H/2 - 10);
    ctx.fillText('Score: ' + Math.floor(score / 10), W/2, H/2 + 20);
  }

  // start loop
  requestAnimationFrame(update);
})();
