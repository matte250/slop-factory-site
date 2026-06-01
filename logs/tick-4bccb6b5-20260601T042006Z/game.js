// Nebula Runner - simple top‑down endless runner
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const bgMusic = new Audio('bgm.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  let audioStarted = false;
  const initAudio = () => {
    if (audioStarted) return;
    audioStarted = true;
    // Resume AudioContext after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    bgMusic.play().catch(() => {});
  };
  const beep = (freq = 440, dur = 0.2) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.1;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Set canvas size to fill the window (you can adjust as needed)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Starfield – small white points moving down for a nebula effect
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  const updateStars = () => {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
  };
  const drawStars = () => {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Ship definition – gradient triangle at the bottom centre
  const ship = {
    width: 30,
    height: 40,
    x: canvas.width / 2,
    y: canvas.height - 60,
    speed: 5,
    movingLeft: false,
    movingRight: false,
    draw() {
      const shipGradient = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.height);
    shipGradient.addColorStop(0, '#0ff');
    shipGradient.addColorStop(1, '#005');
    ctx.fillStyle = shipGradient;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Input handling – arrow keys (or A/D)
  const keyDown = (e) => {
    initAudio();
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') ship.movingLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') ship.movingRight = true;
  };
  const keyUp = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') ship.movingLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') ship.movingRight = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  // Asteroid definition – simple circles falling down
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames between spawns
  let frameCount = 0;

  const spawnAsteroid = () => {
    const radius = 15 + Math.random() * 10;
    const x = radius + Math.random() * (canvas.width - 2 * radius);
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -radius, radius, speed });
  };

  const updateShip = () => {
    if (ship.movingLeft) ship.x -= ship.speed;
    if (ship.movingRight) ship.x += ship.speed;
    // Keep ship within bounds
    ship.x = Math.max(ship.width / 2, Math.min(canvas.width - ship.width / 2, ship.x));
  };

  const updateAsteroids = () => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1); // remove off‑screen
      }
    }
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
  };

  const checkCollisions = () => {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - (ship.y + ship.height / 2);
      const distance = Math.hypot(dx, dy);
      // Approximate ship as circle of radius ship.width/2
      if (distance < a.radius + ship.width / 2) {
        return true;
      }
    }
    return false;
  };

  let score = 0;
  let gameOver = false;

  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 30);
  };

  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
  };

  const loop = () => {
    if (gameOver) {
      drawGameOver();
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw nebula background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000014');
    bgGrad.addColorStop(1, '#000022');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Update entities
    updateShip();
    updateAsteroids();
    updateStars();
    // Draw background stars
    drawStars();
    // Draw entities
    ship.draw();
    // Draw asteroids with subtle gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius);
      grad.addColorStop(0, '#ccc');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score based on time survived
    if (frameCount % 60 === 0) {
      score++;
      beep(800, 0.05); // subtle score tick
    }
    drawScore();
    // Collision check
    if (checkCollisions()) {
      beep(200, 0.3); // collision sound
      gameOver = true;
    }
    frameCount++;
    requestAnimationFrame(loop);
  };

  // Start the game loop
  requestAnimationFrame(loop);
})();
