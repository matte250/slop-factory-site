// game.js – Simple Space Debris Dodge
// Canvas with id="game" is expected in the HTML.

(() => {
  // ---- Audio Setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust(){
    playTone(300, 80);
  }
  function playExplosion(){
    playTone(100, 300);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or a default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ---- Game Object Definitions ----
  const ship = {

    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    color: '#0f0',
    draw() {
      // Gradient ship with white outline
      const grad = ctx.createLinearGradient(this.x - this.width / 2, this.y, this.x + this.width / 2, this.y + this.height);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#080');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    },
    update() {
      if (keys['ArrowLeft'] && this.x - this.width / 2 > 0) this.x -= this.speed;
      if (keys['ArrowRight'] && this.x + this.width / 2 < canvas.width) this.x += this.speed;
      if (keys['ArrowUp'] && this.y > 0) this.y -= this.speed;
      if (keys['ArrowDown'] && this.y + this.height < canvas.height) this.y += this.speed;
    },
  };

  const debris = [];
  const debrisSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  function spawnDebris() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size);
    const speed = Math.random() * 2 + 1;
    debris.push({ x, y: -size, size, speed, color: '#888' });
  }

  function updateDebris(delta) {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed * (delta / 16);
      if (d.y - d.size > canvas.height) debris.splice(i, 1);
    }
    if (performance.now() - lastSpawn > debrisSpawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }
  }

  function drawDebris() {
    for (const d of debris) {
      const grad = ctx.createRadialGradient(
        d.x + d.size / 2,
        d.y + d.size / 2,
        d.size * 0.1,
        d.x + d.size / 2,
        d.y + d.size / 2,
        d.size / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x + d.size / 2, d.y + d.size / 2, d.size / 2, 0, Math.PI * 2);
      ctx.fill();
      // subtle outline
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#222';
      ctx.stroke();
    }
  }

  // ---- Particle system for ship thrust ----
  const particles = [];
  function spawnParticle(x, y) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1,
      vy: Math.random() * 2 + 1,
      radius: Math.random() * 2 + 1,
      life: 30,
    });
  }
  function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * (delta / 16);
      p.y += p.vy * (delta / 16);
      p.life -= 1;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    for (const p of particles) {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Simple starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function updateStars(delta) {
    for (const s of stars) {
      s.y += s.speed * (delta / 16);
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
  }
  function drawStars() {
    for (const s of stars) {
      // twinkling effect by random opacity
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---- Collision detection ----
  function checkCollision() {
    for (const d of debris) {
      const dx = (ship.x) - (d.x + d.size / 2);
      const dy = (ship.y + ship.height / 2) - (d.y + d.size / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < d.size / 2 + Math.max(ship.width, ship.height) / 2) {
        return true;
      }
    }
    return false;
  }

  // ---- Score ----
  let startTime = performance.now();
  let gameOver = false;
  let score = 0;

  function updateScore() {
    const now = performance.now();
    score = Math.floor((now - startTime) / 1000);
  }

  function drawScore() {
    ctx.fillStyle = '#0ff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}s`, 10, 30);
  }

  // ---- Main loop ----
  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`Final Score: ${score}s`, canvas.width / 2, canvas.height / 2 + 40);
      return;
    }
    // Draw space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#001133');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw stars (twinkling)
    updateStars(delta);
    drawStars();

    // Update game objects
    ship.update();
    // spawn particles when moving
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown']) {
      spawnParticle(ship.x, ship.y + ship.height / 2);
      playThrust();
    }
    updateDebris(delta);
    updateParticles(delta);
    updateScore();

    // Draw
ship.draw();
      drawDebris();
      drawParticles();
      drawScore();

    // Collision check
if (checkCollision()) {
        playExplosion();
        gameOver = true;
      }

    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
