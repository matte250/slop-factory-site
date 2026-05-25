// Simple endless runner for <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  // frame counter for animation
  let frameCount = 0;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound(){ playBeep(440, 0.08); }
  function playGameOverSound(){ playBeep(150, 0.4); }
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 200);

  // Player
  const player = {x: 50, y: H - 30, w: 20, h: 20, vy: 0, jumping: false, ducking: false};
  const GRAV = 0.9, JUMP = -12;

// Obstacles
const obstacles = [];
const OBSTACLE_W = 20, OBSTACLE_H = 30;
// simple particles for jump effect
const particles = [];
  let spawnTimer = 0;

  const input = {up:false, down:false};
  const onDown = () => {input.up = true;};
  const onUp = () => {input.up = false;};
  const onKey = e => {if (e.code==='Space') input.up = e.type==='keydown'; if (e.code==='ArrowDown') input.down = e.type==='keydown';};
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  function update(){
    // Player control
    if (input.up && !player.jumping) {
      player.vy = JUMP;
      player.jumping = true;
      // spawn a jump particle
      particles.push({x: player.x + player.w/2, y: player.y + (player.ducking?10:20), alpha: 1});
      playJumpSound();
    }
    if (input.down && !player.jumping) player.ducking = true; else player.ducking = false;

    // physics
    player.vy += GRAV;
    player.y += player.vy;
    if (player.y >= H - (player.ducking?10:30)) {player.y = H - (player.ducking?10:30); player.vy = 0; player.jumping = false;}

    // obstacles
    spawnTimer--;
    if (spawnTimer <= 0) {
      const type = Math.random()<0.5 ? 'spike' : 'low';
      obstacles.push({x: W, type, w: OBSTACLE_W, h: type==='spike'?30:15, y: type==='spike'?H-30: H-15});
      spawnTimer = 80 + Math.random()*100|0;
    }
    for (let i=obstacles.length-1;i>=0;i--) {
      const o = obstacles[i];
      o.x -= 4;
      if (o.x+o.w < 0) obstacles.splice(i,1);
    }

    // collision
    for (const o of obstacles) {
      const ph = player.ducking?10:20;
      if (player.x < o.x+o.w && player.x+player.w > o.x && player.y+ph > o.y) {
        // game over: stop loop
        cancelAnimationFrame(rid);
        ctx.fillStyle='red';
        ctx.font='20px sans-serif';
        ctx.fillText('Game Over', W/2-50, H/2);
        return;
      }
    }
    // update particles
    updateParticles();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // background sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // distant hills (parallax)
    const hillColors = ['#A0D8F1', '#79C0E0', '#58A9D0'];
    hillColors.forEach((col, i) => {
      const offset = (frameCount * (i + 1) * 0.3) % W;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-W + offset, H - 30);
      for (let x = -W + offset; x <= W * 2; x += 80) {
        const y = H - 30 - Math.sin((x + offset) * 0.02) * (10 + i * 5);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W * 2, H);
      ctx.lineTo(-W, H);
      ctx.closePath();
      ctx.fill();
    });
    // scrolling ground pattern
    const groundY = H - 10;
    ctx.fillStyle = '#654321';
    const groundPatternWidth = 40;
    const groundOffset = (frameCount * 2) % groundPatternWidth;
    for (let gx = -groundPatternWidth; gx < W; gx += groundPatternWidth) {
      ctx.fillRect(gx + groundOffset, groundY, groundPatternWidth / 2, 10);
    }
    // player – draw rounded rectangle with gradient and outline
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + (player.ducking?10:20));
    playerGrad.addColorStop(0, '#4A90E2');
    playerGrad.addColorStop(1, '#357ABD');
    ctx.fillStyle = playerGrad;
    const ph = player.ducking?10:20;
    const r = 4; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + ph - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + ph, player.x + player.w - r, player.y + ph);
    ctx.lineTo(player.x + r, player.y + ph);
    ctx.quadraticCurveTo(player.x, player.y + ph, player.x, player.y + ph - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2C5F9E';
    ctx.lineWidth = 2;
    ctx.stroke();
    // particles – simple jump sparkles
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,255,150,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // obstacles – enhanced visuals
    for (const o of obstacles) {
      if (o.type === 'spike') {
        // draw triangular spike
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        // low obstacle as rounded rectangle
        ctx.fillStyle = '#555';
        const r = 2;
        ctx.beginPath();
        ctx.moveTo(o.x + r, o.y);
        ctx.lineTo(o.x + o.w - r, o.y);
        ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + r);
        ctx.lineTo(o.x + o.w, o.y + o.h - r);
        ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - r, o.y + o.h);
        ctx.lineTo(o.x + r, o.y + o.h);
        ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - r);
        ctx.lineTo(o.x, o.y + r);
        ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function updateParticles(){
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y -= 1; // rise
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

function loop(){
    frameCount++;
    update();
    draw();
    rid = requestAnimationFrame(loop);
  }
  let rid = requestAnimationFrame(loop);
})();
