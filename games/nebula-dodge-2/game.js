// Nebula Dodge – simple endless runner game
// Canvas with id="game" must exist in the HTML.
(() => {
  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // unlock audio on first user interaction
  const unlockAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCollision() { beep(150, 0.3); }
  function playScore() { beep(600, 0.1); }
  function playBackground() {
    // simple low hum
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(30, now);
    gain.gain.setValueAtTime(0.02, now);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // player ship
  const ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 5 };

  // asteroids pool
  const asteroids = [];
  const asteroidFreq = 90; // frames between spawns
  // starfield background
  const backgroundStars = [];
  const starCount = 100;
  const initStars = () => {
    for (let i = 0; i < starCount; i++) {
      backgroundStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        alpha: Math.random() * 0.5 + 0.5
      });
    }
  };
  initStars();
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // input handling (arrow keys + mouse)
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    ship.y = e.clientY - rect.top;
  });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const y = -size;
    const speed = Math.random() * 2 + 1 + score / 1000; // increase speed with score
    asteroids.push({ x, y, size, speed });
  }

  function update() {
    if (gameOver) return;
    // move ship via keyboard if mouse not used (mouse overrides)
    if (!keys['MouseMoved']) {
      if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
      if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
      if (keys['ArrowUp'] || keys['w']) ship.y -= ship.speed;
      if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed;
    }
    // keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // spawn asteroids
    if (frame % asteroidFreq === 0) spawnAsteroid();
    frame++;

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) { // passed screen, increase score
        asteroids.splice(i, 1);
        score++;
        playScore();
      } else if (hitTest(ship, a)) {
        gameOver = true;
        playCollision();
      }
    }
    // animate starfield
    for (let i = backgroundStars.length - 1; i >= 0; i--) {
      const s = backgroundStars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = -s.size;
        s.x = Math.random() * width;
      }
    }
  }

  function hitTest(rect, circle) {
    // simple AABB vs circle collision
    const distX = Math.abs(circle.x + circle.size / 2 - (rect.x + rect.w / 2));
    const distY = Math.abs(circle.y + circle.size / 2 - (rect.y + rect.h / 2));
    if (distX > rect.w / 2 + circle.size / 2) return false;
    if (distY > rect.h / 2 + circle.size / 2) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= (circle.size / 2) * (circle.size / 2);
  }

  function draw() {
    // clear background with moving starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw moving stars
    backgroundStars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // ship (triangle with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#050');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.fillText('GAME OVER', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
