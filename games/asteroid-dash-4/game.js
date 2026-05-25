// Simple side‑scrolling "Asteroid Dash" game
// Canvas with id="game" is assumed to exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Size canvas to fill the window (you can adjust as needed)
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ----- Game objects -----
  const ship = {
    x: 80,
    y: canvas.height / 2,
    width: 40,
    height: 20,
    speed: 4,
    dy: 0,
    draw() {
      // draw ship as a green triangle
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      // keep inside canvas
      if (this.y < 0) this.y = 0;
      if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
    },
  };

  const asteroids = [];
  const stars = [];
  // background stars for parallax effect
  const bgStars = [];
  const BG_STAR_COUNT = 200;
  for (let i = 0; i < BG_STAR_COUNT; i++) {
    bgStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  let shield = 100; // max 100
  let lastAsteroid = 0;
  let lastStar = 0;
  let gameOver = false;
  let frame = 0;

  // ----- Helpers -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function rectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; updateShipDy(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; updateShipDy(); });
  let audioInitialized = false;
function initAudio() {
  if (audioInitialized) return;
  // resume audio context on user interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  audioInitialized = true;
}
function updateShipDy() {
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    else if (keys['ArrowDown']) ship.dy = ship.speed;
    else ship.dy = 0;
    initAudio();
  }

  // ----- Game loop -----
  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    frame++;
    // spawn asteroids every ~90 frames
    if (frame - lastAsteroid > 90) {
      asteroids.push({
        x: canvas.width,
        y: rand(0, canvas.height - 30),
        width: 30,
        height: 30,
        speed: rand(2, 5),
      });
      lastAsteroid = frame;
    }
    // spawn stars every ~150 frames
    if (frame - lastStar > 150) {
      stars.push({
        x: canvas.width,
        y: rand(0, canvas.height - 20),
        width: 20,
        height: 20,
        speed: rand(2, 4),
      });
      lastStar = frame;
    }

    // update objects
    ship.update();
    asteroids.forEach(a => a.x -= a.speed);
    stars.forEach(s => s.x -= s.speed);

    // collision detection
    asteroids.forEach((a, i) => {
      if (rectCollision(ship, a)) {
        shield -= 30; // hit reduces shield
        // play collision sound
        playTone(200, 'square', 0.1);
        asteroids.splice(i, 1);
      } else if (a.x + a.width < 0) {
        asteroids.splice(i, 1);
      }
    });
    stars.forEach((s, i) => {
      if (rectCollision(ship, s)) {
        shield = Math.min(100, shield + 20);
        // play collection sound
        playTone(800, 'sine', 0.05);
        stars.splice(i, 1);
      } else if (s.x + s.width < 0) {
        stars.splice(i, 1);
      }
    });
    if (shield <= 0) gameOver = true;

    // render
ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background stars (parallax)
    ctx.fillStyle = '#222';
    bgStars.forEach(st => {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
      // move left for parallax effect
      st.x -= 0.5;
      if (st.x < 0) st.x = canvas.width;
    });
    // shield bar
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 10, 104, 14);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(12, 12, shield, 10);
    // ship & obstacles
    ship.draw();
    // draw asteroids as shaded circles
    asteroids.forEach(a => {
      const gradient = ctx.createRadialGradient(
        a.x + a.width / 2,
        a.y + a.height / 2,
        a.width / 4,
        a.x + a.width / 2,
        a.y + a.height / 2,
        a.width / 2
      );
      gradient.addColorStop(0, '#d55');
      gradient.addColorStop(1, '#600');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x + a.width / 2, a.y + a.height / 2, a.width / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw collectible stars with glow
    stars.forEach(s => {
      const glow = ctx.createRadialGradient(
        s.x + s.width / 2,
        s.y + s.height / 2,
        0,
        s.x + s.width / 2,
        s.y + s.height / 2,
        s.width / 2
      );
      glow.addColorStop(0, '#ff0');
      glow.addColorStop(1, '#aa0');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x + s.width / 2, s.y + s.height / 2, s.width / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ff0'; // stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x + s.width / 2, s.y + s.height / 2, s.width / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
