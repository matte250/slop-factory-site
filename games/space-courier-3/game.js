// Simple side‑scrolling Space Courier game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // Background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function ensureAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }

  // Ship
  const ship = { x: 80, y: H / 2, w: 30, h: 15, dy: 0, speed: 3, health: 3 };

  // Asteroids
  const asteroids = [];
  const asteroidFreq = 90; // frames
  let frame = 0;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; ensureAudio(); });
  window.addEventListener('keyup', e => keys[e.key] = false);

  let gameOverPlayed = false;
function update() {
    // Ship movement (up/down)
    if (keys.ArrowUp || keys.w) {
      ship.dy = -ship.speed;
      playTone(300, 0.05);
    } else if (keys.ArrowDown || keys.s) {
      ship.dy = ship.speed;
      playTone(300, 0.05);
    } else ship.dy = 0;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y + ship.dy));

    // Asteroid spawn
    if (frame % asteroidFreq === 0) {
      const size = 20 + Math.random() * 15;
      asteroids.push({ x: W, y: Math.random() * (H - size), r: size, speed: 2 + Math.random() * 2 });
    }
    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Collision (simple AABB vs circle)
      if (a.x < ship.x + ship.w && a.x + a.r > ship.x && a.y < ship.y + ship.h && a.y + a.r > ship.y) {
        ship.health--;
        // Play damage sound
        playTone(150, 0.2);
        asteroids.splice(i, 1);
      } else if (a.x + a.r < 0) {
        asteroids.splice(i, 1);
      }
    }
    // Update stars (parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H;
      }
    }
    frame++;
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, W, H);
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001022');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y);
    shipGrad.addColorStop(0, '#00aaff');
    shipGrad.addColorStop(1, '#0044ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when moving
    if (ship.dy !== 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h / 2);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 - 5);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 + 5);
      ctx.closePath();
      ctx.fill();
    }
    // Draw asteroids with radial gradient shading
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(
        a.x, a.y + a.r / 2, a.r / 4,
        a.x, a.y + a.r / 2, a.r / 2
      );
      radGrad.addColorStop(0, '#555');
      radGrad.addColorStop(1, '#111');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y + a.r / 2, a.r / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + ship.health, 10, 20);
    if (ship.health <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
      if (!gameOverPlayed) {
        ensureAudio();
        playTone(80, 0.5);
        gameOverPlayed = true;
      }
    }
  }

  function loop() {
    if (ship.health > 0) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
