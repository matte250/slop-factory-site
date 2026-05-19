// Simple Asteroid Dodge game
// Canvas must have id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a tone
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  function playFuel() { playTone(800, 100); }
  function playExplosion() { playTone(200, 300); }
  // Ensure audio context is resumed on first user interaction
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }
  addEventListener('keydown', resumeAudio);
  addEventListener('click', resumeAudio);
  const width = canvas.width;
  const height = canvas.height;

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 30,
    w: 20,
    h: 30,
    speed: 4,
draw() {
        // Ship with subtle gradient
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        grad.addColorStop(0, '#6f0');
        grad.addColorStop(1, '#3a0');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.w / 2, this.y + this.h);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        ctx.closePath();
        ctx.fill();
        // Simple ship outline
        ctx.strokeStyle = '#0c0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
  };

  const keys = {};
  addEventListener('keydown', e => (keys[e.key] = true));
  addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid and fuel cell pools
  const asteroids = [];
  const fuels = [];
// Background stars for visual depth
const stars = [];
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.5,
      speed: 0.5 + Math.random()
    });
  }
}
initStars();
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    asteroids.push({
      x: Math.random() * (width - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speed: 1 + Math.random() * 2
    });
  }

  function spawnFuel() {
    const radius = 5;
    fuels.push({
      x: Math.random() * (width - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speed: 1.5
    });
  }

  // Simple collision helpers
  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - rect.x);
    const distY = Math.abs(circle.y - rect.y);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Clamp ship inside canvas
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Move background stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > height) asteroids.splice(i, 1);
      else if (rectCircleCollide({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, a)) {
        gameOver = true;
        playExplosion();
        alert('Game Over! Score: ' + score);
        return;
      }
    }
    // Move fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.r > height) fuels.splice(i, 1);
      else if (rectCircleCollide({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, f)) {
        score += 10;
        fuels.splice(i, 1);
        playFuel();
      }
    }

    // Spawn new objects periodically
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();
  }

  function draw() {
    // Dark space background
    ctx.fillStyle = '#001b33';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship
    ship.draw();
    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel cells (glowing)
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa6600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
