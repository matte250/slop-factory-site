// game.js – simple side‑scrolling "Space Junk Collector"
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;

  // ----- Game state -----
  const ship = {
    x: 80,
    y: H / 2,
    w: 40,
    h: 20,
    speed: 3,
    shield: 3,
  };

  let score = 0;
  let gameOver = false;

  const debris = [];
  const asteroids = [];

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helper functions -----
  function rectCollides(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnDebris() {
    debris.push({
      x: W,
      y: Math.random() * (H - 20),
      w: 15,
      h: 15,
      speed: 2,
    });
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: W,
      y: Math.random() * (H - size),
      w: size,
      h: size,
      speed: 3,
    });
  }

  // ----- Game loop -----
  let tick = 0;
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, W / 2, H / 2);
      return;
    }

    // clear
    ctx.clearRect(0, 0, W, H);

    // move ship
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // spawn objects
    if (tick % 100 === 0) spawnDebris();
    if (tick % 250 === 0) spawnAsteroid();

    // update and draw debris
    ctx.fillStyle = 'lime';
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x -= d.speed;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      if (rectCollides(ship, d)) {
        score += 10;
        debris.splice(i, 1);
        playTone(800, 0.08); // collect sound
        continue;
      }
      if (d.x + d.w < 0) debris.splice(i, 1);
    }

    // update and draw asteroids
    ctx.fillStyle = 'gray';
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      ctx.fillRect(a.x, a.y, a.w, a.h);
      if (rectCollides(ship, a)) {
        ship.shield -= 1;
        // asteroid hit sound
        playTone(200, 0.2);
        asteroids.splice(i, 1);
        if (ship.shield <= 0) {
          // explosion sound
          playTone(100, 0.5);
          gameOver = true;
        }
        continue;
      }
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }

    // draw ship as triangle
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // draw UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Shield: ' + ship.shield, 10, 40);

    tick++;
    requestAnimationFrame(loop);
  }

  loop();
})();
