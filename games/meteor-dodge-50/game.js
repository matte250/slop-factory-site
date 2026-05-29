// Meteor Dodge Game
// Assumes an HTML canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;
  // Generate starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  }

  // Ship definition (triangle shape)
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0ff',
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.w, this.x + this.speed);
    },
    draw() {
      // Draw ship as an upward-pointing triangle
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Meteor pool
  const meteors = [];
  let spawnTimer = 0;
  let spawnInterval = 1000; // ms
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    // play spawn sound
    playTone(200, 0.05);
    const size = 20 + Math.random() * 30;
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
      color: '#f90'
    });
  }

  function update(delta) {
    if (gameOver) return;
    // increase difficulty
    spawnInterval = Math.max(200, 1000 - score * 10);
    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      spawnMeteor();
      spawnTimer = 0;
    }
    ship.update();
    // update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // remove off-screen
      if (m.y > height) { meteors.splice(i, 1); score++; playTone(300, 0.05); }
      // collision
      if (rectIntersect(ship, m)) { gameOver = true; playTone(100, 0.3); }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // dark space background
    ctx.fillStyle = '#000022';
    ctx.fillRect(0, 0, width, height);
    // draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw ship
    ship.draw();
    // draw meteors with gradient circles
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x + m.w/2, m.y + m.h/2, m.w/4, m.x + m.w/2, m.y + m.h/2, m.w/2);
      grad.addColorStop(0, '#ffb347'); // inner orange
      grad.addColorStop(1, '#ffcc33'); // outer yellow
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w/2, m.y + m.h/2, m.w/2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Input handling
  // Ensure audio context is running on first interaction
  let audioStarted = false;
  function startAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }

  window.addEventListener('keydown', e => {
    startAudio();
    if (e.code === 'ArrowLeft') ship.moveLeft = true;
    if (e.code === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') ship.moveLeft = false;
    if (e.code === 'ArrowRight') ship.moveRight = false;
  });

  // Touch support (simple left/right halves)
  canvas.addEventListener('touchstart', e => {
    startAudio();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    ship.moveLeft = touchX < width / 2;
    ship.moveRight = touchX >= width / 2;
  });
  canvas.addEventListener('touchend', () => { ship.moveLeft = ship.moveRight = false; });

  requestAnimationFrame(loop);
})();
