// Cosmic Dodge game implementation
// Target canvas with id "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or default
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = {
    width: 40,
    height: 30,
    x: 80,
    y: canvas.height / 2 - 15,
    speed: 4,
    color: '#0ff',
    draw() {
      // Ship with gradient fill for a sleek look
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#00a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      // Add simple cockpit glow
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(this.x + this.width * 0.75, this.y + this.height / 2, this.height * 0.3, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      if (keys.ArrowUp || keys.KeyW) this.y = Math.max(0, this.y - this.speed);
      if (keys.ArrowDown || keys.KeyS) this.y = Math.min(canvas.height - this.height, this.y + this.speed);
      if (keys.ArrowLeft || keys.KeyA) this.x = Math.max(0, this.x - this.speed);
      if (keys.ArrowRight || keys.KeyD) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
    },
  };

  const debris = [];
  const debrisSpawnInterval = 1000; // ms
  const debrisSpeedMin = 2;
  const debrisSpeedMax = 6;
  let lastSpawn = 0;
  let distance = 0;
  let gameOver = false;
  let gameOverSoundPlayed = false;
  let collisionHandled = false;

  const keys = {};
  const stars = [];
  const starCount = 150;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
  }
  // Initialize stars after canvas size is set
  initStars();
  // Simple sound utility using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq = 440, duration = 0.1, volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollisionSound() {
    // Low pitch boom
    playBeep(150, 0.2, 0.3);
  }
  function playGameOverSound() {
    // Descending tones
    playBeep(400, 0.1, 0.2);
    setTimeout(() => playBeep(300, 0.1, 0.2), 120);
    setTimeout(() => playBeep(200, 0.2, 0.3), 250);
  }
  // Background ambient hum (loop)
  const humOsc = audioCtx.createOscillator();
  const humGain = audioCtx.createGain();
  humOsc.type = 'triangle';
  humOsc.frequency.value = 30;
  humGain.gain.value = 0.02;
  humOsc.connect(humGain).connect(audioCtx.destination);
  humOsc.start();

  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnDebris() {
    const size = Math.random() * 30 + 10;
    debris.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - size),
      w: size,
      h: size,
      speed: Math.random() * (debrisSpeedMax - debrisSpeedMin) + debrisSpeedMin,
      color: '#f55',
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1, // small rotation
    });
  }

  function updateDebris(dt) {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x -= d.speed;
      d.angle = (d.angle || 0) + (d.rotationSpeed || 0);
      if (d.x + d.w < 0) debris.splice(i, 1);
    }
  }

  function drawDebris() {
    for (const d of debris) {
      ctx.save();
      // Translate to debris center for rotation
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(d.angle || 0);
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }
  }

  function checkCollision() {
    for (const d of debris) {
      if (
        ship.x < d.x + d.w &&
        ship.x + ship.width > d.x &&
        ship.y < d.y + d.h &&
        ship.y + ship.height > d.y
      ) {
        return true;
      }
    }
    return false;
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Distance: ${Math.floor(distance)} px`, canvas.width / 2, canvas.height / 2 + 20);
  }

  function loop(timestamp) {
    if (gameOver) {
      if (!gameOverSoundPlayed) {
        playGameOverSound();
        gameOverSoundPlayed = true;
      }
      drawGameOver();
      return;
    }
    const dt = timestamp - (lastSpawn || timestamp);
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background: gradient sky
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#02031a'); // dark space
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Starfield
    for (const s of stars) {
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // Update and draw ship
    ship.update();
    ship.draw();
    // Spawn debris
    if (timestamp - lastSpawn > debrisSpawnInterval) {
      spawnDebris();
      lastSpawn = timestamp;
    }
    // Update debris
    updateDebris(dt);
    drawDebris();
    // Distance metric
    distance += ship.speed * (dt / 16.67);
    // Collision check
    if (checkCollision()) {
      if (!collisionHandled) {
        playCollisionSound();
        collisionHandled = true;
      }
      gameOver = true;
    }
    // Request next frame
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
