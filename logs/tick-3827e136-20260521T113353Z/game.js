// Simple Space Debris Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Set canvas size to match its displayed size
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateStars();
  }
  resize();
  window.addEventListener('resize', resize);

  // Ship properties
  const ship = {
    w: 30,
    h: 30,
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    speed: 4,
    color: '#0f0',
  };

  // Debris array
  const debris = [];
  // Background stars for visual depth
  let stars = [];
  function generateStars(count = 100) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  let debrisTimer = 0;
  let debrisInterval = 1500; // ms, will decrease over time
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  const keys = {};
  let audioStarted = false;
  function startAudio(){
    if (!audioStarted){
      audioCtx.resume();
      audioStarted = true;
    }
  }
  window.addEventListener('keydown', e => { keys[e.key] = true; startAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnDebris() {
    const size = Math.random() * 20 + 10;
    debris.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 1.5 + 1 + score / 1000,
      color: '#f88',
    });
    // play short ping for new debris
    playSound(200, 0.05);
  }

  function update(dt) {
    // Move ship based on keys (arrow keys or WASD)
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Spawn debris based on timer
    debrisTimer += dt;
    if (debrisTimer > debrisInterval) {
      spawnDebris();
      debrisTimer = 0;
      // gradually increase difficulty
      if (debrisInterval > 400) debrisInterval -= 20;
    }

    // Update debris positions
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed;
      // Remove off-screen debris
      if (d.y > canvas.height) {
        debris.splice(i, 1);
        score += 1;
      } else if (rectIntersect(ship, d)) {
        gameOver = true;
      }
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw debris as rotating squares with gradient fill
    debris.forEach(d => {
      const rot = (performance.now() / 200) % (Math.PI * 2);
      ctx.save();
      ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
      ctx.rotate(rot);
      const grad = ctx.createRadialGradient(0, 0, d.w * 0.2, 0, 0, d.w / 2);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
