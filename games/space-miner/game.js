// Simple Space Miner game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    collect: () => playSound(800, 0.07),
    explode: () => playSound(100, 0.3),
    thrust: () => playSound(300, 0.05),
  };
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  // Ship is now drawn as a triangle for a more dynamic look
  // Added simple thrust effect when moving
  // Added background starfield for depth
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 40,
    h: 20,
    speed: 5,
    color: '#0ff',
  };

  // Game state
  let minerals = [];
  let asteroids = [];
  let score = 0;
  let gameOver = false;
  let lastMineral = 0;
  let lastAsteroid = 0;
  // Starfield for background
  const stars = [];
  const STAR_COUNT = 100;
  const STAR_SPEED = 0.5;
  function initStars(){
    for(let i=0;i<STAR_COUNT;i++){
      stars.push({
        x: Math.random()*width,
        y: Math.random()*height,
        radius: Math.random()*1.5 + 0.5,
        speed: STAR_SPEED + Math.random()*0.5
      });
    }
  }
  initStars();

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') sounds.thrust();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMineral() {
    const size = 10 + Math.random() * 10;
    minerals.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size,
      color: '#ff0',
    });
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size,
      speed: 2 + Math.random() * 3,
      color: '#888',
    });
  }

  function update() {
    // Move starfield
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random()*width;
      }
    });
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Clamp
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn entities
    const now = Date.now();
    if (now - lastMineral > 800) { spawnMineral(); lastMineral = now; }
    if (now - lastAsteroid > 1200) { spawnAsteroid(); lastAsteroid = now; }

    // Update minerals
    minerals.forEach((m, i) => {
      m.y += 2; // falling speed
      // Collision with ship
      if (
        m.x < ship.x + ship.w &&
        m.x + m.r * 2 > ship.x &&
        m.y < ship.y + ship.h &&
        m.y + m.r * 2 > ship.y
      ) {
score += 10;
          sounds.collect();
          minerals.splice(i, 1);
      } else if (m.y > height) {
        minerals.splice(i, 1);
      }
    });

    // Update asteroids
    asteroids.forEach((a, i) => {
      a.y += a.speed;
      // Collision with ship ends game
      const dx = (a.x + a.r) - (ship.x + ship.w / 2);
      const dy = (a.y + a.r) - (ship.y + ship.h / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) {
        sounds.explode();
        gameOver = true;
      } else if (a.y > height) {
        asteroids.splice(i, 1);
      }
    });
  }

  function draw() {
    // Draw background starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    // Ship (triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Thrust effect
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.w/2, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w/2 - 5, ship.y + ship.h + 10);
      ctx.lineTo(ship.x + ship.w/2 + 5, ship.y + ship.h + 10);
      ctx.closePath();
      ctx.fill();
    }
    // Minerals
    minerals.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x + m.r, m.y + m.r, m.r, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
    });
    // Asteroids
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fillStyle = a.color;
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
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
  loop();
})();
