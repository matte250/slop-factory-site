// Simple Orbit Dodge game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  const center = { x: width / 2, y: height / 2 };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust(){ playTone(300, 0.1); }
  function playExplosion(){
    // simple noise burst
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/data.length, 2);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    noise.connect(filter).connect(audioCtx.destination);
    noise.start();
  }


  // ----- Game objects -----
  const ship = {
    x: center.x,
    y: center.y - 100,
    angle: 0,
    radius: 12,
    speedX: 0,
    speedY: 0,
    thrust: 0.2,
    drag: 0.99,
    rotateSpeed: 0.07,
  };

  const planet = { x: center.x, y: center.y, radius: 30 };
  const asteroids = [];
  const maxAsteroids = 20;
  const asteroidSpeed = 1.5;
  const stars = [];
  const particles = [];
  // generate stars background
  (function initStars(){
    const count = 100;
    for(let i=0;i<count;i++){
      stars.push({x: Math.random()*width, y: Math.random()*height, r: Math.random()*2+1});
    }
  })();

  let keys = {};
  let gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helper functions -----
  function spawnAsteroid() {
    // spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 10 + Math.random() * 15;
    switch (side) {
      case 0: // top
        x = Math.random() * width;
        y = -size;
        break;
      case 1: // right
        x = width + size;
        y = Math.random() * height;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + size;
        break;
      case 3: // left
        x = -size;
        y = Math.random() * height;
        break;
    }
    // aim roughly toward center with some variance
    const angle = Math.atan2(center.y - y, center.x - x) + (Math.random() - 0.5) * 0.5;
    vx = Math.cos(angle) * asteroidSpeed;
    vy = Math.sin(angle) * asteroidSpeed;
    asteroids.push({ x, y, vx, vy, radius: size });
  }

  function update() {
    if (gameOver) return;

    // handle input
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.speedX += Math.cos(ship.angle - Math.PI / 2) * ship.thrust;
      ship.speedY += Math.sin(ship.angle - Math.PI / 2) * ship.thrust;
      // add thrust particle and sound
      particles.push({
        x: ship.x - Math.cos(ship.angle - Math.PI / 2) * ship.radius,
        y: ship.y - Math.sin(ship.angle - Math.PI / 2) * ship.radius,
        vx: -Math.cos(ship.angle - Math.PI / 2) * 1.5,
        vy: -Math.sin(ship.angle - Math.PI / 2) * 1.5,
        life: 30
      });
      playThrust();
    }

    // apply drag and move ship
    ship.speedX *= ship.drag;
    ship.speedY *= ship.drag;
    ship.x += ship.speedX;
    ship.y += ship.speedY;

    // check off‑screen
    if (
      ship.x < -ship.radius || ship.x > width + ship.radius ||
      ship.y < -ship.radius || ship.y > height + ship.radius
    ) {
      gameOver = true;
      playExplosion();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove if far off screen
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        break;
      }
    }

    // spawn new asteroids periodically
    if (asteroids.length < maxAsteroids && Math.random() < 0.02) spawnAsteroid();
  }

  function draw() {
    // background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#444';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // planet with radial gradient
    const pGrad = ctx.createRadialGradient(
      planet.x, planet.y, planet.radius * 0.2,
      planet.x, planet.y, planet.radius
    );
    pGrad.addColorStop(0, '#4caf50');
    pGrad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    // ship thrust particles
    particles.forEach((p, i) => {
      ctx.fillStyle = `rgba(255,165,0,${p.life / 30})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    });

    // ship (triangle) with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#ecf0f1';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius / 2, ship.radius);
    ctx.lineTo(-ship.radius / 2, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // asteroids with simple shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.2,
        a.x, a.y, a.radius
      );
      grad.addColorStop(0, '#bdc3c7');
      grad.addColorStop(1, '#7f8c8d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  spawnAsteroid();
  requestAnimationFrame(loop);
})();
