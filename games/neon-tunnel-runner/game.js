// Neon Tunnel Runner – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;

  const ship = { x: w / 2, y: h * 0.8, w: 20, h: 30, vx: 0 };
  const speed = 4;
  const obstacles = [];
  const particles = [];
  const gap = 120; // width of tunnel gap
  const segH = 30; // height of each obstacle segment
  let scroll = 0;
  let gameOver = false;

  // audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.01);
      osc.stop(audioCtx.currentTime + 0.02);
    }, duration);
  }

  function playMoveSound() {
    playTone(300, 50);
  }

  function playGameOverSound() {
    playTone(100, 300);
  }

  // controls
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      ship.vx = -speed;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playMoveSound();
    } else if (e.key === 'ArrowRight') {
      ship.vx = speed;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playMoveSound();
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' && ship.vx < 0) ship.vx = 0;
    else if (e.key === 'ArrowRight' && ship.vx > 0) ship.vx = 0;
  });

  function spawnObstacle() {
    const gapX = Math.random() * (w - gap);
    // left block
    obstacles.push({ x: 0, y: -segH, w: gapX, h: segH });
    // right block
    obstacles.push({ x: gapX + gap, y: -segH, w: w - gapX - gap, h: segH });
  }

  function update() {
    if (gameOver) return;
    // move ship
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x + ship.vx));
    // emit particle for trail
    particles.push({ x: ship.x + ship.w/2, y: ship.y, alpha: 0.8, life: 30 });
    // update particles
    particles.forEach(p => {
      p.y += 1; // rise slightly
      p.alpha -= 0.025;
      p.life--;
    });
    // remove dead particles
    while (particles.length && particles[0].life <= 0) particles.shift();
    // scroll tunnel
    scroll += 2;
    if (scroll >= segH) {
      scroll = 0;
      spawnObstacle();
    }
    // move obstacles
    obstacles.forEach(o => (o.y += 2));
    // discard off‑screen
    while (obstacles.length && obstacles[0].y > h) obstacles.shift();
    // collision detection
    for (const o of obstacles) {
      if (
        ship.y < o.y + o.h && ship.y + ship.h > o.y &&
        ship.x < o.x + o.w && ship.x + ship.w > o.x
      ) {
        gameOver = true;
        break;
      }
    }
    draw();
    if (!gameOver) requestAnimationFrame(update);
    else {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playGameOverSound();
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', w / 2 - 120, h / 2);
    }
  }

function draw() {
  // background gradient (deep space)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#02010a');
  bgGrad.addColorStop(1, '#15002b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // draw particles (ship trail)
  particles.forEach((p, i) => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // obstacles with neon glow
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#0ff';
  ctx.fillStyle = '#0ff';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
  ctx.shadowBlur = 0;

  // ship (neon yellow triangle with glow)
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ff0';
  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

  // start loop
  spawnObstacle();
  requestAnimationFrame(update);
})();
