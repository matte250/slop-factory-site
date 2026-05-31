// Simple Meteor Escape game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Full‑screen canvas (adjust as needed)
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // create starfield background
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
  function drawStars() {
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ship definition
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 20,
    speed: 4,
    color: '#0ff',
    dx: 0,
    dy: 0,
    draw() {
      // Ship body gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      // Thrust flame when moving forward
      if (this.dy < 0) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x - this.width / 4, this.y + this.height + 10);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height + 10);
        ctx.closePath();
        ctx.fill();
      }
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep within bounds
      this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
      this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }
  };

  // Meteor definition
  class Meteor {
    constructor() {
      this.radius = Math.random() * 15 + 10;
      this.x = Math.random() * canvas.width;
      this.y = -this.radius;
      this.speedY = Math.random() * 2 + 1;
      this.speedX = (Math.random() - 0.5) * 2;
      this.color = '#a52a2a';
    }
    draw() {
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, this.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
    }
    outOfBounds() {
      return this.y - this.radius > canvas.height || this.x + this.radius < 0 || this.x - this.radius > canvas.width;
    }
  }

  const meteors = [];
  let lastMeteorTs = 0;
  const meteorInterval = 800; // ms

  let gameOver = false;

  // Input handling
  const keys = {};
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') startThrustSound();
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') stopThrustSound();
  });
  function handleInput() {
    ship.dx = 0;
    ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
  }

  function checkCollision() {
    for (const m of meteors) {
      const distX = ship.x - m.x;
      const distY = ship.y + ship.height / 2 - m.y; // ship tip
      const distance = Math.hypot(distX, distY);
      if (distance < m.radius) {
        return true;
      }
    }
    return false;
  }

  function gameLoop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Draw background starfield
    drawStars();

    // Spawn meteors
    if (timestamp - lastMeteorTs > meteorInterval) {
      meteors.push(new Meteor());
      lastMeteorTs = timestamp;
    }

    // Update and draw meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.update();
      m.draw();
      if (m.outOfBounds()) meteors.splice(i, 1);
    }

    // Ship
    handleInput();
    ship.update();
    ship.draw();

    // Collision
    if (checkCollision()) {
      playExplosionSound();
      gameOver = true;
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
