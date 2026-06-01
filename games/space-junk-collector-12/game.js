// Space Junk Collector – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);
  // generate simple starfield background with slight drift
  const stars = [];
  const starSpeed = 0.2;
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // ensure audio context is running after user interaction
  window.addEventListener('click', () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  function playTone(freq, length = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + length);
    osc.stop(audioCtx.currentTime + length);
  }
  function playCollect() { playTone(600, 0.08); }
  function playHazard() { playTone(200, 0.3); }
  function playThrust() { playTone(400, 0.05); }

  // player ship
  const ship = { x: W / 2, y: H / 2, r: 15, speed: 3, dx: 0, dy: 0 };
  const keys = {};
  document.addEventListener('keydown', e => (keys[e.key] = true));
  document.addEventListener('keyup', e => (keys[e.key] = false));

  // junk objects
  const junk = [];
  let score = 0;
  let missed = 0;
  let missStart = null;
  let gameOver = false;

  function spawnJunk() {
    const isHazard = Math.random() < 0.15; // 15% hazardous
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2 + score * 0.02;
    junk.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 8,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      hazard: isHazard,
    });
  }

  setInterval(spawnJunk, 800); // spawn rate

  function update() {
    if (gameOver) return;
    // move background stars for subtle drift
    stars.forEach(s => {
      s.x += starSpeed;
      if (s.x > W) s.x = 0;
    });
    // ship movement
    ship.dx = ship.dy = 0;
    if (keys.ArrowUp) { ship.dy = -ship.speed; playThrust(); }
    if (keys.ArrowDown) ship.dy = ship.speed;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x + ship.dx));
    ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y + ship.dy));

    // update junk
    for (let i = junk.length - 1; i >= 0; i--) {
      const j = junk[i];
      j.x += j.dx;
      j.y += j.dy;
      // collection
      const dist = Math.hypot(j.x - ship.x, j.y - ship.y);
      if (dist < j.r + ship.r) {
        if (j.hazard) {
          playHazard();
          endGame('Hit hazardous debris');
          return;
        }
        score++;
        playCollect();
        junk.splice(i, 1);
        continue;
      }
      // out of bounds -> missed
      if (j.x < -j.r || j.x > W + j.r || j.y < -j.r || j.y > H + j.r) {
        missed++;
        if (!missStart) missStart = Date.now();
        junk.splice(i, 1);
      }
    }
    // miss condition: 5+ misses within 10 s
    if (missed >= 5 && Date.now() - missStart <= 10000) {
      endGame('Too many missed junk');
      return;
    }
    // reset miss counter after 10 s window passes
    if (missStart && Date.now() - missStart > 10000) {
      missed = 0;
      missStart = null;
    }
  }

function draw() {
    // motion‑blur background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);
    // starfield with slight drift
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship – triangle with optional thrust flame
    const shipAngle = Math.atan2(ship.dy || 0, ship.dx || 0) || -Math.PI / 2;
    const shipSize = ship.r;
    ctx.fillStyle = '#0ff';
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle);
    ctx.beginPath();
    ctx.moveTo(0, -shipSize);
    ctx.lineTo(shipSize * 0.6, shipSize);
    ctx.lineTo(-shipSize * 0.6, shipSize);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving forward
    if (ship.dy < 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, shipSize);
      ctx.lineTo(shipSize * 0.3, shipSize + shipSize * 0.8);
      ctx.lineTo(-shipSize * 0.3, shipSize + shipSize * 0.8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // junk – gradient for hazardous, simple for normal
    junk.forEach(j => {
      if (j.hazard) {
        const grad = ctx.createRadialGradient(j.x, j.y, 0, j.x, j.y, j.r * 2);
        grad.addColorStop(0, 'red');
        grad.addColorStop(1, 'orange');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.beginPath();
      ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 30);
    }
  }

  function endGame(msg) {
    console.log(msg);
    gameOver = true;
  }

  // start
  loop();
})();
