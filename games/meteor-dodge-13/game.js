// Simple Meteor Dodge game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  // Resume audio context on first interaction
  window.addEventListener('click', () => { if (audioCtx.state !== 'running') audioCtx.resume(); });

  const ship = { w: 40, h: 20, x: w/2-20, y: h-30, speed: 5 };
  const stars = [];
  const maxStars = 200;
  let lives = 3;
  const meteors = [];
  let frames = 0;

  // initialize background stars with size and twinkle phase
  for (let i = 0; i < maxStars; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: Math.random() * 0.5 + 0.2,
      size: Math.random() * 2 + 1,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnMeteor() {
    const size = Math.random()*30+20;
    meteors.push({
      x: Math.random()*(w-size),
      y: -size,
      r: size/2,
      speed: Math.random()*2+1,
      color: `hsl(${Math.random()*360},70%,50%)`
    });
    // play a short rise sound for meteor appearance
    playSound(300, 0.07);
  }

  function update() {
    if (gameOver) return;
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(w-ship.w, ship.x));

    // meteors
    if (frames % 60 === 0) spawnMeteor();
    meteors.forEach(m => m.y += m.speed);
    // remove off-screen
    for (let i = meteors.length-1; i>=0; i--) {
      const m = meteors[i];
      if (m.y - m.r > h) meteors.splice(i,1);
      // collision
      const dx = (ship.x+ship.w/2) - m.x;
      const dy = (ship.y+ship.h/2) - m.y;
if (Math.hypot(dx, dy) < m.r + ship.h/2) {
          // play collision sound
          playSound(100, 0.2);
          lives--;
          meteors.splice(i,1);
          if (lives <= 0) { 
            gameOver = true; 
            // game over sound
            playSound(50, 0.4);
          }
        }
    }
    frames++;
  }

  function draw() {
    // clear canvas
    ctx.clearRect(0, 0, w, h);
    // background (dark space gradient)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // stars (twinkling with size)
    stars.forEach(s => {
      // move star for simple parallax effect
      s.y += s.speed;
      if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
      // twinkle effect via alpha
      const alpha = 0.5 + 0.5 * Math.sin(frames * 0.1 + s.twinkle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0; // reset alpha
    // ship as triangle for better look
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y); // tip at top center
    ctx.lineTo(ship.x, ship.y + ship.h); // left base
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h); // right base
    ctx.closePath();
    ctx.fill();
    // meteors with colors and slight glow
    meteors.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = m.color || '#888';
      ctx.fill();
      // glow effect
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    });
    // HUD
    ctx.fillStyle = 'yellow';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + lives, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', w / 2 - 80, h / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
