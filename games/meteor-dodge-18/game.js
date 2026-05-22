// Meteor Dodge Game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur/1000);
    osc.stop(audioCtx.currentTime + dur/1000);
  }
  function playCollision() { beep(100, 300); }
  function playSpawn() { beep(300, 100); }

  const player = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.w, this.x + this.speed);
    },
      draw() {
        ctx.fillStyle = '#0af';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.h);
        ctx.lineTo(this.x + this.w/2, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.closePath();
        ctx.fill();
      }
  };

  const meteors = [];
  // starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  let score = 0;
  let gameOver = false;
  let startTime = Date.now();

  function spawnMeteor() {
    playSpawn();
    const size = Math.random() * 30 + 20;
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2
    });
  }

  function update(delta) {
    if (gameOver) return;
    player.update();
    meteors.forEach(m => {
      m.y += m.speed;
      m.angle += 0.02;
    });
    // move stars for parallax effect
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > height) s.y = 0;
    });
    // remove off-screen meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].y > height) meteors.splice(i, 1);
    }
    // collision detection
    for (const m of meteors) {
      if (
        player.x < m.x + m.w &&
        player.x + player.w > m.x &&
        player.y < m.y + m.h &&
        player.y + player.h > m.y
      ) {
        playCollision();
        gameOver = true;
        break;
      }
    }
    // score based on time survived
    score = Math.floor((Date.now() - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player
    player.draw();
    // meteors with gradient and rotation
    meteors.forEach(m => {
      const radGrad = ctx.createRadialGradient(0, 0, m.w/4, 0, 0, m.w/2);
      radGrad.addColorStop(0, '#ff8');
      radGrad.addColorStop(1, '#c44');
      ctx.fillStyle = radGrad;
      ctx.save();
      ctx.translate(m.x + m.w/2, m.y + m.h/2);
      ctx.rotate(m.angle);
      ctx.fillRect(-m.w/2, -m.h/2, m.w, m.h);
      ctx.restore();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastSpawn) lastSpawn = timestamp;
    const delta = timestamp - lastSpawn;
    if (delta > spawnInterval) {
      spawnMeteor();
      lastSpawn = timestamp;
    }
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  // start
  requestAnimationFrame(loop);
})();
