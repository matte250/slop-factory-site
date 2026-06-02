// Simple Meteor Dodge game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Starfield initialization
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      alpha: Math.random() * 0.5 + 0.5,
      twinkleSpeed: Math.random() * 0.02 + 0.01
    });
  }
  function updateStars() {
    stars.forEach(s => {
      s.alpha += s.twinkleSpeed * (Math.random() < 0.5 ? -1 : 1);
      if (s.alpha < 0.3) s.alpha = 0.3;
      if (s.alpha > 1) s.alpha = 1;
    });
  }

  // Ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    shield: 0,
draw() {
        // Draw ship as a triangle
        ctx.fillStyle = this.shield ? '#0ff' : '#0f0';
        ctx.beginPath();
        ctx.moveTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.closePath();
        ctx.fill();
      }
  };

  // Meteor class
  class Meteor {
    constructor() {
      this.r = Math.random() * 15 + 10;
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = 2 + Math.random() * meteorSpeedInc;
    }
    update() {
      this.y += this.speed;
    }
    draw() {
      ctx.fillStyle = '#a52a2a';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() {
      return this.y - this.r > height;
    }
  }

  // Power‑up class (shield)
  class PowerUp {
    constructor() {
      this.r = 12;
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = 2;
    }
    update() { this.y += this.speed; }
    draw() {
      ctx.fillStyle = '#00f';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() { return this.y - this.r > height; }
  }

  let meteors = [];
  let powerUps = [];
  let frames = 0;
  let meteorSpeedInc = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state !== 'running') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    meteors.push(new Meteor());
    // Meteor spawn sound
    playTone(300, 0.08);
  }
  function spawnPowerUp() {
    powerUps.push(new PowerUp());
  }

function update() {
    if (gameOver) return;
    frames++;
    // Increase speed every 600 frames (~10s at 60fps)
    if (frames % 600 === 0) meteorSpeedInc += 0.5;
    // Spawn meteors
    if (frames % 30 === 0) spawnMeteor();
    // Occasionally spawn shield power‑up
    if (frames % 900 === 0) spawnPowerUp();

    // Ship movement
    if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys['ArrowRight']) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // Update meteors
    meteors.forEach(m => m.update());
    meteors = meteors.filter(m => !m.offScreen());

    // Update power‑ups
    powerUps.forEach(p => p.update());
    powerUps = powerUps.filter(p => !p.offScreen());

    // Update stars twinkle
    updateStars();

    // Collision detection
    meteors.forEach(m => {
      const dx = Math.max(ship.x, Math.min(m.x, ship.x + ship.w)) - m.x;
      const dy = Math.max(ship.y, Math.min(m.y, ship.y + ship.h)) - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < m.r) {
        // Play collision sound
        playTone(200, 0.15);
        if (ship.shield > 0) {
          ship.shield--;
        } else {
          gameOver = true;
          // Game over sound
          playTone(100, 0.5);
        }
      }
    });
    powerUps.forEach((p, i) => {
      const dx = Math.max(ship.x, Math.min(p.x, ship.x + ship.w)) - p.x;
      const dy = Math.max(ship.y, Math.min(p.y, ship.y + ship.h)) - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.r) {
        // Power‑up collection sound
        playTone(600, 0.12);
        ship.shield = Math.min(3, ship.shield + 1); // max 3 shields
        powerUps.splice(i, 1);
      }
    });
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    // Draw entities
    ship.draw();
    meteors.forEach(m => m.draw());
    powerUps.forEach(p => p.draw());
    if (ship.shield) {
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText('Shield: ' + ship.shield, 10, 20);
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
