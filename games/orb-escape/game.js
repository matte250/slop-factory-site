// Minimal Orb Escape game
// Targets <canvas id="game"></canvas> in the host HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur / 1000);
    osc.start(now);
    osc.stop(now + dur / 1000);
  }

  // Player definition
  const player = {
    radius: 10,
    x: width / 2,
    y: height - 30,
    speed: 4,
    moveLeft: false,
    moveRight: false,
  };

  // Obstacle definition
  class Obstacle {
    constructor() {
      this.width = 30 + Math.random() * 40; // 30-70px
      this.height = 10;
      this.x = Math.random() * (width - this.width);
      this.y = -this.height; // start above canvas
      this.speed = 2 + Math.random() * 2; // 2-4px/frame
    }
    update() {
      this.y += this.speed;
    }
    draw() {
      ctx.fillStyle = '#b00';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    offScreen() {
      return this.y > height;
    }
  }

  const obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let gameOver = false;
  let score = 0;

  // Input handling (resume audio context on first interaction)
  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('mousedown', resumeAudio);
    window.removeEventListener('touchstart', resumeAudio);
  }
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('mousedown', resumeAudio);
  window.addEventListener('touchstart', resumeAudio);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  function update() {
    if (gameOver) return;

    // Move player
    if (player.moveLeft) player.x -= player.speed;
    if (player.moveRight) player.x += player.speed;
    // Clamp to canvas
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));

    // Spawn obstacles
    if (spawnTimer <= 0) {
      obstacles.push(new Obstacle());
      spawnTimer = spawnInterval;
      // Play spawn sound
      playTone(400, 80);
    } else {
      spawnTimer--;
    }

    // Update obstacles
    obstacles.forEach((obs) => obs.update());
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].offScreen()) obstacles.shift();

    // Collision detection
    for (const obs of obstacles) {
      const withinX =
        player.x + player.radius > obs.x &&
        player.x - player.radius < obs.x + obs.width;
      const withinY =
        player.y + player.radius > obs.y &&
        player.y - player.radius < obs.y + obs.height;
        if (withinX && withinY) {
          // Play collision sound
          playTone(150, 200);
          gameOver = true;
          break;
        }
    }

    if (!gameOver) score++;
  }

  function draw() {
    // Clear and draw background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw player with glow
    const grad = ctx.createRadialGradient(
      player.x,
      player.y,
      player.radius * 0.2,
      player.x,
      player.y,
      player.radius
    );
    grad.addColorStop(0, '#6f6');
    grad.addColorStop(1, '#0b0');
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = '#3f3';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;

    // Draw obstacles
    obstacles.forEach((obs) => obs.draw());

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 30);
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
