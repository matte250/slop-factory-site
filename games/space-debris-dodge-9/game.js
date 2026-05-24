// Simple Space Debris Dodge game targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player ship
    const ship = {
    // draw with gradient for better look
  // draw with gradient for better look
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 4,
    dx: 0,
    dy: 0,
draw() {
      // ship gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
      grad.addColorStop(0, '#00f');
      grad.addColorStop(1, '#fff');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Collision helper
  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  // Debris
  const debris = [];
  // Stars background
  const stars = [];
  const STAR_COUNT = 100;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1
      });
    }
  }
  initStars();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000 + 0.02);
  }

  let spawnInterval = 1000; // ms
  let lastSpawn = 0;
  let speedIncrement = 0.02; // per second
  let baseSpeed = 2;
  let score = 0;
  let lives = 3;
  let shield = false;
  let shieldTimer = 0;

  function spawnDebris() {
    const size = Math.random() * 20 + 10;
    debris.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: baseSpeed + Math.random() * 2
    });
  }

  function update(dt) {
    // Move ship
    ship.dx = ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // Spawn debris
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // Update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed * (dt / 16);
      if (d.y > height) {
        debris.splice(i, 1);
        score++;
        // play success sound
        playTone(800, 50);
        // gradually increase difficulty
        spawnInterval = Math.max(200, spawnInterval - 5);
        baseSpeed += speedIncrement * (dt / 1000);
      } else if (rectCollide(ship, d)) {
        if (shield) {
          // destroy debris, keep shield
          debris.splice(i, 1);
        } else {
          // play hit sound
          playTone(200, 100, 'triangle');
          lives--;
          debris.splice(i, 1);
          if (lives <= 0) {
            // Game over sound
            playTone(100, 500, 'sawtooth');
            alert('Game Over! Score: ' + score);
            document.location.reload();
            return;
          }
        }
      }
    }

    // Shield timer
    if (shield) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) shield = false;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background: radial dark space
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    bgGrad.addColorStop(0, '#001030');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw stars with twinkle effect
    stars.forEach(s => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, s.size, s.size);
      ctx.globalAlpha = 1;
    });
    // draw ship with gradient
    ship.draw();
    // draw debris with slight color variation
    debris.forEach(d => {
      const grad = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y + d.h);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#bbb');
      ctx.fillStyle = grad;
      ctx.fillRect(d.x, d.y, d.w, d.h);
    });
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Lives: ' + lives, 10, 40);
    if (shield) {
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 3;
      ctx.strokeRect(ship.x - 3, ship.y - 3, ship.w + 6, ship.h + 6);
    }
  }

  function loop(timestamp) {
    if (!lastFrame) lastFrame = timestamp;
    const dt = timestamp - lastFrame;
    update(dt);
    draw();
    lastFrame = timestamp;
    requestAnimationFrame(loop);
  }
  let lastFrame = 0;

  // Simple power‑up: press Space to activate shield (5‑second cooldown)
  let shieldCooldown = 0;
  window.addEventListener('keydown', e => {
  // Ensure audio context is running (required by some browsers)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
    if (e.key === ' ') {
      if (shieldCooldown <= 0) {
        shield = true;
        shieldTimer = 5000; // ms
        shieldCooldown = 10000; // ms
        // shield activation sound
        playTone(600, 150, 'sine');
      }
    }
  });

  function cooldownTick(dt) {
    if (shieldCooldown > 0) shieldCooldown -= dt;
  }

  // integrate cooldown into loop
  const origUpdate = update;
  update = dt => {
    origUpdate(dt);
    cooldownTick(dt);
  };

  requestAnimationFrame(loop);
})();
