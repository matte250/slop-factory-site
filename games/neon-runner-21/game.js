// Minimal Neon Runner
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;

  // player
  const player = {x: 50, y: H - 30, w: 20, h: 20, vy: 0, onGround: true};
  const GRAV = 0.8, JUMP = -12, SPEED = 3;

  // obstacles (breaker blocks) and gaps
  const obstacles = [];
  let gapTimer = 0; // when >0 we are in a gap

// audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, duration) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
      osc.stop(audioCtx.currentTime + duration / 1000);
    }
    // input
    const jump = () => { if (player.onGround) { player.vy = JUMP; player.onGround = false; playTone(440, 100); } };
    canvas.addEventListener('mousedown', jump);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  // game loop
  function loop() {
    // update player
    player.vy += GRAV;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }

    // generate obstacles / gaps
    if (obstacles.length === 0 || obstacles[obstacles.length-1].x < W - 200) {
      const isGap = Math.random() < 0.2 && gapTimer === 0; // occasional gap
      const width = 30;
      if (isGap) {
        gapTimer = 80; // pixels to skip
      } else {
        obstacles.push({x: W, w: width, h: 30, type: 'breaker'});
      }
    }
    // move obstacles
    for (let i = obstacles.length-1; i >=0; i--) {
      const o = obstacles[i];
      o.x -= SPEED;
      if (o.x + o.w < 0) obstacles.splice(i,1);
    }
    if (gapTimer>0) gapTimer -= SPEED;

    // collision
    for (const o of obstacles) {
      if (player.x < o.x+o.w && player.x+player.w > o.x &&
          player.y+player.h > H - o.h) { // breaker sits on ground
        // game over: stop loop
        cancelAnimationFrame(animId);
        playTone(220, 300); // lower tone for game over
        ctx.fillStyle = 'red';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', W/2-80, H/2);
        return;
      }
    }

    // draw
    ctx.clearRect(0,0,W,H);
    // neon gradient background
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // moving grid (simulated forward motion)
    ctx.strokeStyle = 'rgba(0,255,255,0.2)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offset = (Date.now() / 30) % gridSize; // animate grid offset
    for (let x= -gridSize; x<W+gridSize; x+=gridSize) {
      ctx.beginPath();
      ctx.moveTo(x+offset,0);
      ctx.lineTo(x+offset,H);
      ctx.stroke();
    }
    for (let y= -gridSize; y<H+gridSize; y+=gridSize) {
      ctx.beginPath();
      ctx.moveTo(0,y+offset);
      ctx.lineTo(W,y+offset);
      ctx.stroke();
    }
    // player neon rectangle with glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // obstacles with glow
    ctx.shadowColor = 'rgba(255,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'red';
    for (const o of obstacles) {
      ctx.fillRect(o.x, H - o.h, o.w, o.h);
    }
    // reset shadow for UI text
    ctx.shadowBlur = 0;

    animId = requestAnimationFrame(loop);
  }
  let animId = requestAnimationFrame(loop);
})();
