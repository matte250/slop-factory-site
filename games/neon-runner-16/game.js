// Neon Runner – simple endless runner
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Star field for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function updateStars() {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
  }

  // Particle burst for collisions
  const particles = [];
  function spawnParticles(x, y) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        radius: Math.random() * 2 + 1,
      });
    }
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // Audio setup using Web Audio API
  let audioCtx;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playTone(freq, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollisionSound() {
    // low‑pitched, short burst
    playTone(150, 200);
  }
  // ensure audio context is initialized on first user interaction
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('keydown', e => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });


  // Player (glowing dot)
  const player = {
    x: width / 2,
    y: height - 50,
    radius: 8,
    speed: 4,
    color: '#0ff',
    moveLeft: false,
    moveRight: false,
  };

  // Obstacles – rotating bars
  class Bar {
    constructor() {
      this.x = Math.random() * (width - 200) + 100; // keep within margins
      this.y = -20; // start above canvas
      this.length = 120;
      this.thickness = 6;
      this.angle = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.03; // radians per frame
      this.speedY = 2 + Math.random() * 2; // downward speed
    }
    update() {
      this.y += this.speedY;
      this.angle += this.rotationSpeed;
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // gradient bar for neon effect
      const grad = ctx.createLinearGradient(-this.length / 2, 0, this.length / 2, 0);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(0.5, '#f80');
      grad.addColorStop(1, '#ff0');
      ctx.fillStyle = grad;
      ctx.fillRect(-this.length / 2, -this.thickness / 2, this.length, this.thickness);
      ctx.restore();
    }
    // simple point‑to‑segment distance
    collides(px, py, pr) {
      // line endpoints in world coords
      const cos = Math.cos(this.angle);
      const sin = Math.sin(this.angle);
      const hx = (this.length / 2) * cos;
      const hy = (this.length / 2) * sin;
      const x1 = this.x - hx;
      const y1 = this.y - hy;
      const x2 = this.x + hx;
      const y2 = this.y + hy;
      // project point onto line segment
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      let t = ((px - x1) * dx + (py - y1) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.hypot(px - projX, py - projY);
      return dist < pr + this.thickness / 2;
    }
  }

  const bars = [];
  let frameCount = 0;
  let score = 0;
  let gameOver = false;

  function spawnBar() {
    if (bars.length < 8 && Math.random() < 0.02) {
      bars.push(new Bar());
      // sound effect for new obstacle
      playTone(300, 80);
    }
  }

  function update() {
    if (gameOver) return;
    // player movement
    if (player.moveLeft) player.x -= player.speed;
    if (player.moveRight) player.x += player.speed;
    // keep within canvas bounds
    if (player.x < player.radius) player.x = player.radius;
    if (player.x > width - player.radius) player.x = width - player.radius;

    // background stars update
    updateStars();

    // obstacles
    spawnBar();
    for (let i = bars.length - 1; i >= 0; i--) {
      const b = bars[i];
      b.update();
      if (b.y - b.length > height) bars.splice(i, 1); // remove off‑screen
    }

    // collision detection
    for (const b of bars) {
      if (b.collides(player.x, player.y, player.radius)) {
        gameOver = true;
        // spawn particle burst at collision point
        spawnParticles(player.x, player.y);
        // play collision sound
        playCollisionSound();
        break;
      }
    }
    // particles update
    updateParticles();
    // score as distance (frames) survived
    score = Math.floor(frameCount / 60);
    frameCount++;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient for neon vibe
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // player glow
    const grad = ctx.createRadialGradient(
      player.x,
      player.y,
      0,
      player.x,
      player.y,
      player.radius * 3
    );
    grad.addColorStop(0, 'rgba(0,255,255,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 3, 0, Math.PI * 2);
    ctx.fill();
    // solid dot
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // bars
    for (const b of bars) b.draw(ctx);
    // particles (glowing bursts) with additive blending
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      const alpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = `rgba(255,100,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      player.moveLeft = true;
      playTone(500, 50);
    }
    if (e.key === 'ArrowRight') {
      player.moveRight = true;
      playTone(500, 50);
    }
    if (gameOver && e.key === 'Enter') {
      // restart
      location.reload();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  // start game
  requestAnimationFrame(loop);
})();
