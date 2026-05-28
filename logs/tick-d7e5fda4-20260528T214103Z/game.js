// Simple Meteor Dodge game with enhanced graphics
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Create starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  // Player ship (triangle shape)
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Ensure audio context resumes on first interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    shield: false,
    shieldTimer: 0,
    draw() {
      ctx.fillStyle = this.shield ? 'cyan' : 'white';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // shield aura
      if (this.shield) {
        ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, Math.max(this.w, this.h), 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.w, this.x + this.speed);
      if (this.shield) {
        this.shieldTimer -= delta;
        if (this.shieldTimer <= 0) this.shield = false;
      }
    }
  };

  // Meteors with rotation and gradient
  const meteors = [];
  let meteorSpawnTimer = 0;
  let meteorSpeed = 2;
  const spawnMeteor = () => {
    const size = 20 + Math.random() * 30;
    const angle = Math.random() * Math.PI * 2;
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: meteorSpeed + Math.random(),
      rot: angle
    });
  };

  // Power‑ups (shield only for brevity)
  const powerUps = [];
  let powerUpTimer = 0;
  const spawnPowerUp = () => {
    const size = 20;
    powerUps.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 1.5,
      type: 'shield',
      rot: 0
    });
  };

  // Timer (lose condition after 60 seconds)
  let gameTime = 60; // seconds
  let timer = gameTime;
  const timerBarHeight = 5;

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  let last = performance.now();
  let delta = 0;
  let gameOver = false;

  const loop = () => {
    const now = performance.now();
    delta = (now - last) / 1000; // seconds
    last = now;
    if (gameOver) return;

    // Update timer
    timer -= delta;
    if (timer <= 0) {
      endGame('Time up!');
      return;
    }

    // Clear and draw background stars
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Update ship
    ship.update();
    ship.draw();

    // Spawn meteors
    meteorSpawnTimer -= delta;
    if (meteorSpawnTimer <= 0) {
      spawnMeteor();
      meteorSpawnTimer = Math.max(0.2, 1.5 - timer / gameTime); // faster over time
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      m.rot += 0.01;
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.save();
      ctx.translate(m.x + m.w / 2, m.y + m.h / 2);
      ctx.rotate(m.rot);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // collision
      if (!ship.shield && rectIntersect(ship, m)) {
        playBeep(200, 0.2);
        endGame('Hit by meteor');
        return;
      }
      if (m.y > height) meteors.splice(i, 1);
    }

    // Power‑up logic
    powerUpTimer -= delta;
    if (powerUpTimer <= 0) {
      spawnPowerUp();
      powerUpTimer = 15 + Math.random() * 10;
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      p.rot += 0.02;
      // draw as rotating star
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const angle = (j * 2 * Math.PI) / 5 - Math.PI / 2;
        const radius = j % 2 === 0 ? p.w / 2 : p.w / 4;
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (rectIntersect(ship, p)) {
        if (p.type === 'shield') {
          ship.shield = true;
          ship.shieldTimer = 5; // seconds
        }
        powerUps.splice(i, 1);
      } else if (p.y > height) powerUps.splice(i, 1);
    }

    // Increase meteor speed gradually
    meteorSpeed += delta * 0.02;

    // Draw timer bar with gradient
    const gradBar = ctx.createLinearGradient(0, height - timerBarHeight, width, height);
    gradBar.addColorStop(0, 'lime');
    gradBar.addColorStop(1, 'red');
    ctx.fillStyle = gradBar;
    ctx.fillRect(0, height - timerBarHeight, (timer / gameTime) * width, timerBarHeight);

    requestAnimationFrame(loop);
  };

  const rectIntersect = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const endGame = msg => {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillText(msg, width / 2, height / 2 + 20);
  };

  // Start loop
  requestAnimationFrame(loop);
})();
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    shield: false,
    shieldTimer: 0,
    draw() {
      ctx.fillStyle = this.shield ? 'cyan' : 'white';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.w, this.x + this.speed);
      if (this.shield) {
        this.shieldTimer -= delta;
        if (this.shieldTimer <= 0) this.shield = false;
      }
    }
  };

  // Meteors
  const meteors = [];
  let meteorSpawnTimer = 0;
  let meteorSpeed = 2;
  const spawnMeteor = () => {
    const size = 20 + Math.random() * 30;
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: meteorSpeed + Math.random()
    });
  };

  // Power‑ups (shield only for brevity)
  const powerUps = [];
  let powerUpTimer = 0;
  const spawnPowerUp = () => {
    const size = 20;
    powerUps.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 1.5,
      type: 'shield'
    });
  };

  // Timer (lose condition after 60 seconds)
  let gameTime = 60; // seconds
  let timer = gameTime;
  const timerBarHeight = 5;

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  let last = performance.now();
  let delta = 0;
  let gameOver = false;

  const loop = () => {
    const now = performance.now();
    delta = (now - last) / 1000; // seconds
    last = now;
    if (gameOver) return;

    // Update timer
    timer -= delta;
    if (timer <= 0) {
      endGame('Time up!');
      return;
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Update ship
    ship.update();
    ship.draw();

    // Spawn meteors
    meteorSpawnTimer -= delta;
    if (meteorSpawnTimer <= 0) {
      spawnMeteor();
      meteorSpawnTimer = Math.max(0.2, 1.5 - timer / gameTime); // faster over time
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      ctx.fillStyle = 'gray';
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
      // collision
      if (!ship.shield && rectIntersect(ship, m)) {
        playBeep(200, 0.2);
        endGame('Hit by meteor');
        return;
      }
      if (m.y > height) meteors.splice(i, 1);
    }

    // Power‑up logic
    powerUpTimer -= delta;
    if (powerUpTimer <= 0) {
      spawnPowerUp();
      powerUpTimer = 15 + Math.random() * 10;
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      ctx.fillStyle = 'gold';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      if (rectIntersect(ship, p)) {
        if (p.type === 'shield') {
          ship.shield = true;
          ship.shieldTimer = 5; // seconds
        }
        powerUps.splice(i, 1);
      } else if (p.y > height) powerUps.splice(i, 1);
    }

    // Increase meteor speed gradually
    meteorSpeed += delta * 0.02;

    // Draw timer bar
    ctx.fillStyle = 'red';
    ctx.fillRect(0, height - timerBarHeight, (timer / gameTime) * width, timerBarHeight);

    requestAnimationFrame(loop);
  };

  const rectIntersect = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const endGame = msg => {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillText(msg, width / 2, height / 2 + 20);
  };

  // Start loop
  requestAnimationFrame(loop);
})();
