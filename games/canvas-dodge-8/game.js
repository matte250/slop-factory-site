// Simple Canvas Dodge game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Play a short collision beep
  function playCollisionSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  // Ensure audio context is resumed on first user interaction
  window.addEventListener('click',()=>{if(audioCtx.state==='suspended')audioCtx.resume();}, {once:true});

  // Player
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Asteroids
  const asteroids = [];
  const asteroidSize = 30;
  // Stars background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  let spawnTimer = 0;
  const spawnInterval = 60; // frames

  let score = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    if (spawnTimer <= 0) {
      asteroids.push({ x: Math.random() * (width - asteroidSize), y: -asteroidSize, speed: 2 + Math.random() * 2 });
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision detection
      if (
        a.x < ship.x + ship.w &&
        a.x + asteroidSize > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + asteroidSize > ship.y
      ) {
          gameOver = true;
          playCollisionSound();
        }
      // Remove off‑screen
      if (a.y > height) {
        asteroids.splice(i, 1);
        score++;
      }
    }
  }

  function draw() {
    // Space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, 2, 2));
    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (radial gradient circles)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + asteroidSize/2, a.y + asteroidSize/2, asteroidSize*0.2, a.x + asteroidSize/2, a.y + asteroidSize/2, asteroidSize/2);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + asteroidSize/2, a.y + asteroidSize/2, asteroidSize/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
