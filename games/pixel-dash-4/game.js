// Minimal Pixel Dash implementation for <canvas id="game"></canvas>
(() => {
  // Audio setup using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 200);

  // Game state
  let running = true;
  let gravity = 0.6; // positive = down, negative = up
  let invTimer = 0; // frames remaining for inverted gravity

  const player = {
    x: 50,
    y: H - 30,
    w: 20,
    h: 30,
    vy: 0,
    onGround: true,
    draw() {
      // simple pixel‑art character with a gradient body
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // outline
      ctx.strokeStyle = '#003366';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x, this.y, this.w, this.h);
    },
    update() {
      this.vy += gravity;
      this.y += this.vy;
      // ground / ceiling check based on gravity direction
      if (gravity > 0) {
        if (this.y + this.h >= H) {
          this.y = H - this.h;
          this.vy = 0;
          this.onGround = true;
        } else this.onGround = false;
      } else {
        if (this.y <= 0) {
          this.y = 0;
          this.vy = 0;
          this.onGround = true;
        } else this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = gravity > 0 ? -12 : 12;
        playTone(440, 0.1); // jump sound
      }
    }
  };

  const obstacles = [];
  const orbs = [];
  let frame = 0;

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: W, y: gravity > 0 ? H - size : 0, w: size, h: size });
  }
  function spawnOrb() {
    const r = 10;
    const yPos = gravity > 0 ? H / 3 : (2 * H) / 3;
    orbs.push({ x: W, y: yPos, r });
  }

  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function circleRectCollision(circle, rect) {
    const cx = circle.x;
    const cy = circle.y;
    const rx = rect.x;
    const ry = rect.y;
    const rw = rect.w;
    const rh = rect.h;
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  function drawBackground() {
    // sky gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky
    bgGrad.addColorStop(1, '#fff'); // horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ground strip
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - 10, W, 10);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  function update() {
    if (!running) { drawBackground(); drawGameOver(); return; }
    // draw background gradient and ground
    drawBackground();
    player.update();
    player.draw();

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      // obstacle with gradient and rounded edges
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#ff7777');
      obsGrad.addColorStop(1, '#aa0000');
      ctx.fillStyle = obsGrad;
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 4);
      ctx.fill();
      if (rectCollision(player, o)) { playTone(220,0.3); running = false; }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // orbs movement
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.x -= 4;
      // orb with radial gradient glow
      const orbGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      orbGrad.addColorStop(0, '#ffffaa');
      orbGrad.addColorStop(1, '#ff8800');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
      if (circleRectCollision(orb, player)) {
        // invert gravity for 180 frames (~3 sec @ 60fps)
        gravity = -gravity;
        invTimer = 180;
        playTone(660, 0.15); // orb collect sound
        orbs.splice(i, 1);
      }
      if (orb.x + orb.r < 0) orbs.splice(i, 1);
    }

    // gravity inversion timer
    if (invTimer > 0) {
      invTimer--;
      if (invTimer === 0) gravity = -gravity; // restore
    }

    // spawn logic
    frame++;
    if (frame % 120 === 0) spawnObstacle(); // every 2 sec
    if (frame % 600 === 0) spawnOrb(); // every 10 sec

    requestAnimationFrame(update);
  }

    // input - resume audio on first interaction
    function resumeAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
    canvas.addEventListener('click', e=>{ resumeAudio(); player.jump(); });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); resumeAudio(); player.jump(); }, { passive: false });


  // start loop
  update();
})();
