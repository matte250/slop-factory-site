// Simple endless runner game based on IDEA.md
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollisionSound(){
    // quick two‑tone explosion
    playBeep(150, 0.2);
    setTimeout(()=>playBeep(80,0.3),200);
  }
  // Ensure canvas dimensions match its displayed size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

// Starfield background
const stars = [];
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    speed: 0.2 + Math.random() * 0.3,
  });
}
function updateStars() {
  for (const s of stars) {
    s.x -= s.speed;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height;
    }
  }
}
function drawStars() {
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

  // Game objects
  const ship = {
    x: 50,
    y: canvas.height / 2,
    w: 30,
    h: 30,
    speed: 5,
    dy: 0,
    draw() {
      // Draw ship as a simple triangle
      ctx.fillStyle = '#0af';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      // Keep ship within canvas bounds
      if (this.y < 0) this.y = 0;
      if (this.y + this.h > canvas.height) this.y = canvas.height - this.h;
    },
  };

  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidSpawnInterval = 90; // frames
  let frameCount = 0;
  let gameOver = false;
  let startTime = performance.now();
  let score = 0;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const y = Math.random() * (canvas.height - size);
    const speed = 2 + frameCount / 1500; // gradually increase
    asteroids.push({ x: canvas.width, y, w: size, h: size, speed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1); // off‑screen
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.w/2,
        a.y + a.h/2,
        a.w*0.1,
        a.x + a.w/2,
        a.y + a.h/2,
        a.w/2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y < a.y + a.h &&
        ship.y + ship.h > a.y
      ) {
        return true;
      }
    }
    return false;
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 20);
  }

  function gameLoop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width/2 - 60, canvas.height/2);
      ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width/2 - 80, canvas.height/2 + 30);
      return;
    }
    // Clear
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Update and draw background stars
    updateStars();
    drawStars();

    // Update objects
    ship.update();
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidSpawnInterval;
    } else {
      asteroidTimer--;
    }
    updateAsteroids();

    // Draw
    ship.draw();
    drawAsteroids();

    // Collision
    if (checkCollision()) {
      playCollisionSound();
      gameOver = true;
    }

    // Score based on elapsed time
    const now = performance.now();
    score = (now - startTime) / 1000;
    drawScore();

    frameCount++;
    requestAnimationFrame(gameLoop);
  }

  // Input handling (Arrow keys and WASD)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    updateShipDirection();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    updateShipDirection();
  });

  function updateShipDirection() {
    if (keys.ArrowUp || keys.w) ship.dy = -ship.speed;
    else if (keys.ArrowDown || keys.s) ship.dy = ship.speed;
    else ship.dy = 0;
  }

  // Start the loop
  requestAnimationFrame(gameLoop);
})();
