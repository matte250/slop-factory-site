// Simple Space Collector game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Player (spaceship)
  const player = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
  };

  // Game state
  let stars = [];
  let asteroids = [];
  let score = 0;
  let missed = 0;
  let gameOver = false;
  let frames = 0;
  // Audio context and sound helpers
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure context starts after user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }


  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnStar() {
    const size = 10;
    stars.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }

  function spawnAsteroid() {
    const size = 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 3 + Math.random() * 2 });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;
    frames++;
    // player movement
    if (keys['ArrowLeft']) player.dx = -player.speed;
    else if (keys['ArrowRight']) player.dx = player.speed;
    else player.dx = 0;
    player.x = Math.max(0, Math.min(width - player.w, player.x + player.dx));

    // spawn entities
    if (frames % 60 === 0) spawnStar(); // roughly 1 per second at 60fps
    if (frames % 180 === 0) spawnAsteroid(); // one asteroid every 3 seconds

    // update stars
    stars.forEach(s => s.y += s.speed);
    // update asteroids
    asteroids.forEach(a => a.y += a.speed);

    // collision detection
    stars = stars.filter(s => {
      if (rectIntersect(player, s)) {
        score++;
        playTone(800, 0.1);
        return false; // collected
      }
      if (s.y > height) {
        missed++;
        return false; // missed
      }
      return true;
    });

    for (const a of asteroids) {
      if (rectIntersect(player, a)) {
        playTone(200, 0.3); // crash sound
        gameOver = true;
        break;
      }
    }
    if (missed >= 10) gameOver = true;

    // remove off‑screen asteroids
    asteroids = asteroids.filter(a => a.y <= height);
  }

  function draw() {
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#000010');
    bg.addColorStop(1, '#001030');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // draw player (gradient triangle spaceship)
    const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    // draw stars with soft glow
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(s.x + s.w / 2, s.y + s.h / 2, 0, s.x + s.w / 2, s.y + s.h / 2, s.w / 2);
      grad.addColorStop(0, 'rgba(255,255,150,1)');
      grad.addColorStop(1, 'rgba(255,255,150,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw asteroids with darker edges
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, 0, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlay
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Missed: ${missed}/10`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
