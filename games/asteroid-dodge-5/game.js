// Simple Asteroid Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 40,
    w: 30,
    h: 30,
    speed: 5,
  };

  // Stars background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let difficulty = 1;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }

  // Input handling
  const keys = {};
  // Ensure audio context is resumed on first user interaction
  function resumeAudio() {
    if (audioCtx.state !== 'running') {
      audioCtx.resume();
    }
  }
  window.addEventListener('keydown', e => {keys[e.key] = true; resumeAudio();});
  window.addEventListener('keyup', e => {keys[e.key] = false;});
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    ship.y = e.clientY - rect.top;
    resumeAudio();
  });

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * difficulty;
    asteroids.push({x, y: -size, w: size, h: size, speed});
    // play a short beep when an asteroid appears
    playBeep(300, 80);
  }

  function update(dt) {
    // move ship with arrow keys
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside bounds
    ship.x = Math.max(ship.w/2, Math.min(width - ship.w/2, ship.x));
    ship.y = Math.max(ship.h/2, Math.min(height - ship.h/2, ship.y));

    // spawn asteroids over time
    asteroidTimer += dt;
    if (asteroidTimer > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
      // increase difficulty gradually
      difficulty += 0.01;
      asteroidInterval = Math.max(200, asteroidInterval - 5);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off-screen
      if (a.y > height) {
        asteroids.splice(i, 1);
        score++;
      }
    }

    // collision detection
    for (const a of asteroids) {
      if (rectCircleCollide(ship, a)) {
        // play collision sound
        playBeep(100, 300);
        alert('Game Over! Score: ' + score);
        // reset game
        asteroids.length = 0;
        score = 0;
        difficulty = 1;
        asteroidInterval = 1000;
        break;
      }
    }
  }

  function rectCircleCollide(rect, circle) {
    // simple AABB-circle collision
    const distX = Math.abs(circle.x + circle.w/2 - rect.x);
    const distY = Math.abs(circle.y + circle.h/2 - rect.y);
    if (distX > (rect.w/2 + circle.w/2)) return false;
    if (distY > (rect.h/2 + circle.h/2)) return false;
    if (distX <= rect.w/2) return true;
    if (distY <= rect.h/2) return true;
    const dx = distX - rect.w/2;
    const dy = distY - rect.h/2;
    return (dx*dx + dy*dy <= (circle.w/2)*(circle.w/2));
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;
    // draw ship (triangle with gradient)
    const grad = ctx.createLinearGradient(ship.x - ship.w/2, ship.y - ship.h/2, ship.x + ship.w/2, ship.y + ship.h/2);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#0ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h/2);
    ctx.lineTo(ship.x - ship.w/2, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w/2, ship.y + ship.h/2);
    ctx.closePath();
    ctx.fill();
    // draw asteroids with radial gradient
    for (const a of asteroids) {
      const radGrad = ctx.createRadialGradient(
        a.x + a.w/2, a.y + a.h/2, a.w/4,
        a.x + a.w/2, a.y + a.h/2, a.w/2
      );
      radGrad.addColorStop(0, '#888');
      radGrad.addColorStop(1, '#222');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
