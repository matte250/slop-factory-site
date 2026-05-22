// Simple Meteor Dodge game targeting canvas with id="game"
// Ship moves left/right with Arrow keys (or A/D). Meteors fall and are removed on collision or when reaching bottom.
// Game ends on ship hit or when 10 meteors have reached the bottom.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // --- Visual enhancements ---------------------------------------------------
  // Starfield background (static stars)
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5
  }));

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // --- Sound manager ---------------------------------------------------
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
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.1);
    }, dur);
  }
  function playExplosion() { playTone(100, 150); }
  function playSpawn() { playTone(300, 80); }
  function playGameOverSound() { playTone(50, 400); }
  // background hum loop
  setInterval(() => playTone(200, 200), 3000);

  // Ship definition (triangle for a sleek look)
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.width, this.x + this.speed);
    },
    draw() {
      // gradient hull
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#0a0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Meteor pool with radial gradient
  const meteors = [];
  let meteorSpawnTimer = 0;
  const meteorSpawnInterval = 60; // frames
  let meteorSpeed = 2;
  let meteorsReachedBottom = 0;
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    const size = 20 + Math.random() * 30; // 20-50px
    const hue = Math.floor(Math.random() * 40) + 0; // red/orange range
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: meteorSpeed + Math.random(),
      hue
    });
    playSpawn(); // sound when meteor appears
  }

  function updateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // collision with ship (simple AABB)
      if (
        m.x < ship.x + ship.width &&
        m.x + m.size > ship.x &&
        m.y < ship.y + ship.height &&
        m.y + m.size > ship.y
      ) {
        gameOver = true;
        playExplosion(); // sound on collision
      }
      // reached bottom
      if (m.y > height) {
        meteors.splice(i, 1);
        meteorsReachedBottom++;
        if (meteorsReachedBottom >= 10) gameOver = true;
      }
    }
  }

  function drawMeteors() {
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.1,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, `hsla(${m.hue}, 80%, 60%, 0.9)`);
      grad.addColorStop(1, `hsla(${m.hue}, 80%, 30%, 0.2)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Missed: ${meteorsReachedBottom}/10`, 10, 40);
  }

  function loop() {
    if (gameOver) {
      // Dim background and play sound
      playGameOverSound();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2 - 60, height / 2 + 30);
      return;
    }
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#013');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    drawStars();
    ship.update();
    ship.draw();
    updateMeteors();
    drawMeteors();
    drawScore();

    if (meteorSpawnTimer-- <= 0) {
      spawnMeteor();
      meteorSpawnTimer = meteorSpawnInterval;
    }
    if (score % 500 === 0 && score !== 0) meteorSpeed += 0.2;
    score++;
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = false;
  });

  // Start the loop
  requestAnimationFrame(loop);
})();

