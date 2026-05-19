// Simple Asteroid Dodger game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }
  function thrustSound(){playBeep(400,0.05);} 
  function crashSound(){playBeep(100,0.5);}
  // set canvas size to fill parent
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    speed: 3,
    color: 'cyan'
  };

  const keys = {};
  let audioUnlocked = false;
  function unlockAudio(){
    if (!audioUnlocked) {
      audioCtx.resume();
      audioUnlocked = true;
    }
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    unlockAudio();
    // play thrust sound on movement keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      thrustSound();
    }
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Asteroid manager
  const asteroids = [];
  const asteroidCount = 5;
  const asteroidSize = 30;
  const asteroidSpeed = 2;

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 2 + 1;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -asteroidSize : canvas.width + asteroidSize;
    const y = Math.random() * canvas.height;
    const vx = side === 'left' ? asteroidSpeed : -asteroidSpeed;
    const vy = (Math.random() - 0.5) * asteroidSpeed;
    const rot = Math.random() * 0.1;
    asteroids.push({x, y, vx, vy, rot, angle:0, radius: asteroidSize});
  }

  for(let i=0;i<asteroidCount;i++) spawnAsteroid();

  let score = 0;
  let gameOver = false;

  function update() {
    // move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rot;
      // recycle when off-screen
      if (a.x < -asteroidSize || a.x > canvas.width + asteroidSize) {
        asteroids.splice(i, 1);
        spawnAsteroid();
        continue;
      }
      // collision with ship (circle-circle)
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        crashSound();
      }
    }
    if (!gameOver) score++;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#000030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
    // ship (triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
