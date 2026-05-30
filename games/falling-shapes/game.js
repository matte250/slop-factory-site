// Simple Falling Shapes game
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioInitialized = false;
  function ensureAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audioInitialized = true;
  }
  document.addEventListener('keydown', () => {
    if (!audioInitialized) ensureAudio();
  });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player (circle)
  const player = {
    x: width / 2,
    y: height - 30,
    r: 15,
    speed: 4,
    dx: 0,
    dy: 0,
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside canvas
      this.x = Math.max(this.r, Math.min(width - this.r, this.x));
      this.y = Math.max(this.r, Math.min(height - this.r, this.y));
    },
    draw() {
      // radial gradient for player
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#0099ff');
      ctx.shadowColor = 'rgba(0,150,255,0.6)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  };

  // Falling shapes
  const shapes = [];
  let particles = [];

  // particle factory
  function createParticle(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 2,
      ttl: Math.random() * 30 + 30,
      color,
      draw() {
        ctx.globalAlpha = Math.max(this.ttl / 60, 0);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    };
  }
  let spawnTimer = 0;
  let spawnInterval = 1500; // ms
  let lastTime = performance.now();
  let gameOver = false;
  let difficulty = 1; // speed multiplier

  function randomShape() {
    const size = 20 + Math.random() * 30;
    return {
      x: Math.random() * (width - size) + size / 2,
      y: -size,
      r: size / 2,
      speed: 1 + Math.random() * 2,
      color: `hsl(${Math.random() * 360},70%,60%)`,
      update(dt) {
        this.y += this.speed * difficulty * dt / 16.666; // normalize to 60fps base
      },
      draw() {
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };
  }

  function handleInput(e, isDown) {
    const step = player.speed;
    if (isDown) {
      // play movement sound (mid pitch)
      playTone(400, 0.03);
    }
    switch (e.key) {
      case 'ArrowLeft':
        player.dx = isDown ? -step : 0; break;
      case 'ArrowRight':
        player.dx = isDown ? step : 0; break;
      case 'ArrowUp':
        player.dy = isDown ? -step : 0; break;
      case 'ArrowDown':
        player.dy = isDown ? step : 0; break;
    }
  }
  document.addEventListener('keydown', e => handleInput(e, true));
  document.addEventListener('keyup', e => handleInput(e, false));

  function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  }

  function update(dt) {
    if (gameOver) return;
    // increase difficulty over time
    difficulty = 1 + (performance.now() - lastTime) / 20000; // speed up every 20s

    player.update();
    // spawn new shapes
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      const newShape = randomShape();
      shapes.push(newShape);
      // play spawn sound (high pitch)
      playTone(600, 0.05);
      // slowly decrease interval to increase spawn rate
      spawnInterval = Math.max(300, spawnInterval - 10);
    }
    // update shapes
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      s.update(dt);
      if (s.y - s.r > height) {
        shapes.splice(i, 1);
        continue;
      }
      if (checkCollision(player, s)) {
        // explode into particles
        for (let i = 0; i < 20; i++) {
          particles.push(createParticle(player.x, player.y, s.color));
        }
        playTone(200, 0.4); // death sound
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw player with radial gradient and shadow
    player.draw();
    // draw shapes with shadow
    shapes.forEach(s => s.draw());

    // particles (if any)
    particles.forEach(p => p.draw());
    particles = particles.filter(p => p.ttl > 0);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
