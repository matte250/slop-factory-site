// Game: Asteroid Dodge
// Canvas with id="game" must exist in the HTML.
// The ship moves with arrow keys and must avoid asteroids that spawn from the right.
// Score = seconds survived, displayed in the top‑left corner.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // audio context for simple sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure canvas fills its container (or use its intrinsic size)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;
  // background gradient (space nebula)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#02070a');
  bgGrad.addColorStop(1, '#1a0033');
  // create starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: 20 + Math.random() * 30
    });
  }

  // ---- Game objects ----
  const ship = {
  // ship defined; stars will be generated globally

    x: 80,
    y: canvas.height / 2,
    radius: 12,
    speed: 200 // pixels per second
  };

  class Asteroid {
    constructor() {
      this.x = canvas.width + Math.random() * 100;
      this.y = Math.random() * canvas.height;
      this.r = 15 + Math.random() * 20;
      this.speed = 100 + Math.random() * 100; // leftward speed
    }
    update(dt) {
      this.x -= this.speed * dt;
    }
    isOffScreen() {
      return this.x + this.r < 0;
    }
draw() { // draw asteroid with gradient
    const grad = ctx.createRadialGradient(this.x, this.y, this.r*0.2, this.x, this.y, this.r);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#444');
    ctx.fillStyle = grad;
      //     // ctx.fillStyle = '#666'; // gradient already set
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ---- Game state ----
  let asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1.0; // seconds
  let startTime = null;
  let gameOver = false;

  function reset() {
    ship.x = 80;
    ship.y = canvas.height / 2;
    asteroids = [];
    lastSpawn = 0;
    startTime = null;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function update(dt) { // update background stars and stars field
  // move stars leftward to simulate parallax
  stars.forEach(star => {
    star.x -= star.speed * dt;
    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * canvas.height;
    }
  });

    // move ship
    if (keys.ArrowUp) ship.y -= ship.speed * dt;
    if (keys.ArrowDown) ship.y += ship.speed * dt;
    if (keys.ArrowLeft) ship.x -= ship.speed * dt;
    if (keys.ArrowRight) ship.x += ship.speed * dt;
    // keep inside bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // spawn asteroids
    lastSpawn += dt;
    if (lastSpawn > spawnInterval) {
      asteroids.push(new Asteroid());
      lastSpawn = 0;
    }

    // update asteroids & remove off‑screen
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.isOffScreen());

    // collision detection (circle vs circle)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        gameOver = true;
        // play crash sound
        playBeep(80, 0.3);
        break;
      }
    }
  }

  function draw() { // draw background with stars and starfield
    // fill space background with nebula gradient
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    ctx.fillStyle = '#ccc';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw ship (triangle pointing right)
    ctx.fillStyle = '#0a0';
    ctx.beginPath();
    ctx.moveTo(ship.x - ship.radius, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y);
    ctx.closePath();
    ctx.fill();
    // draw asteroids
    asteroids.forEach(a => a.draw());
    // draw score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    // draw game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Survived ${elapsed}s`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
    }
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    } else {
      // restart on any key press
      window.addEventListener('keydown', () => reset(), { once: true });
    }
  }

  // start the game
  reset();
})();
