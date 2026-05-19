// Simple Space Debris Dodge game
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5
  }));
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  function playCollisionSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  // Ship definition (triangle shape)
  const ship = {
    w: 40,
    h: 20,
    x: (width - 40) / 2,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Game state
  let asteroids = [];
  let lives = 3;
  let score = 0;
  let lastAsteroid = 0;
  let startTime = performance.now();
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 20;
    const x = Math.random() * (width - size);
    const baseSpeed = 1 + (performance.now() - startTime) * 0.0005; // accelerate over time
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // rotation per frame
    asteroids.push({ x, y: -size, w: size, h: size, speed: baseSpeed, angle, rotSpeed });
  }

  function update(delta) {
    if (gameOver) return;
    // Move ship
    ship.dx = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    ship.x = Math.min(width - ship.w, Math.max(0, ship.x + ship.dx));

    // Spawn asteroids every 800ms
    if (performance.now() - lastAsteroid > 800) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }

    // Update stars (slow downward drift for parallax effect)
    stars.forEach(s => {
      s.y += 0.2; // subtle speed
      if (s.y > height) { s.x = Math.random() * width; s.y = 0; }
    });

    // Update asteroids (position and rotation)
    asteroids.forEach(a => {
      a.y += a.speed;
      a.angle += a.rotSpeed;
    });
    // Remove off‑screen asteroids and increase score
    asteroids = asteroids.filter(a => {
      if (a.y > height) { score++; return false; }
      // Collision detection (simple AABB)
      if (
        a.x < ship.x + ship.w && a.x + a.w > ship.x &&
        a.y < ship.y + ship.h && a.y + a.h > ship.y
      ) {
        playCollisionSound();
        lives--;
        if (lives <= 0) {
          gameOver = true;
        }
        return false; // remove collided asteroid
      }
      return true;
    });
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Starfield
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ship
    ship.draw();

    // Asteroids with rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.angle);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(-a.w / 2, -a.h / 2, a.w, a.h);
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${lives}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
