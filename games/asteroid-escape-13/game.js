// Simple Asteroid Escape game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after first user interaction
  function unlockAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  }
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('click', unlockAudio);
  function playTone(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Starfield background
  const stars = [];
  const starCount = 150;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
    });
  }
function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}
// Move stars slowly to create parallax
function updateStars() {
  stars.forEach(s => {
    s.y += 0.4; // speed of starfield
    if (s.y > height) s.y = 0;
  });
}


  // Ship
  const ship = {
    x: width / 2,
    y: height - 50,
    w: 30,
    h: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    color: '#0f0',
    draw() {
      // draw ship with a simple gradient
      const grad = ctx.createLinearGradient(this.x, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#080');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
      // outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside canvas
      this.x = Math.max(this.w / 2, Math.min(width - this.w / 2, this.x));
      this.y = Math.max(this.h / 2, Math.min(height - this.h / 2, this.y));
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function handleInput() {
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.dx = ship.speed;
    if (keys['ArrowUp'] || keys['KeyW']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['KeyS']) ship.dy = ship.speed;
  }

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size) + size / 2;
    const y = -size;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y, size, speed });
    // subtle whoosh for new asteroid
    playTone(120, 'sawtooth', 0.05);
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
    if (asteroidTimer++ > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#f44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Collision detection
  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + Math.max(ship.w, ship.h) / 2) {
        return true;
      }
    }
    return false;
  }

  // Score
  let score = 0;
  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
  }

  // Main loop
  let gameOver = false;
  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      ctx.fillText(`Score: ${Math.floor(score)}`, width / 2 - 70, height / 2 + 40);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    // dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    updateStars();
    drawStars();
    handleInput();
    ship.update();
    updateAsteroids();
    ship.draw();
    drawAsteroids();
    drawScore();
if (checkCollision()) {
        // collision sound
        playTone(80, 'square', 0.2);
        gameOver = true;
      }
    score += 0.1;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
