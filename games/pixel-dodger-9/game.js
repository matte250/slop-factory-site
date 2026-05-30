// Minimalist Pixel Dodger game implementation
// Canvas with id="game" expected in HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };

  // Player square
  const player = {
    size: 30,
    x: width / 2 - 15,
    y: height - 35,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Circle (enemy) definition
  class Circle {
    constructor() {
      this.r = 15 + Math.random() * 10; // radius 15-25
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = 2 + Math.random() * 2; // falling speed
    }
    update(delta) {
      this.y += this.speed * delta;
    }
    draw() {
      // Draw circle with radial gradient for a glowing effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#ff5555');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff5555';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  let circles = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  // Input handling
  const keyMap = { ArrowLeft: 'moveLeft', ArrowRight: 'moveRight' };
  // Ensure audio context is resumed on first user interaction
  const startAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  window.addEventListener('keydown', startAudio, { once: true });
  window.addEventListener('click', startAudio, { once: true });
  window.addEventListener('keydown', e => {
    if (keyMap[e.key] !== undefined) player[keyMap[e.key]] = true;
  });
  window.addEventListener('keyup', e => {
    if (keyMap[e.key] !== undefined) player[keyMap[e.key]] = false;
  });

  function reset() {
    player.x = width / 2 - player.size / 2;
    player.y = height - player.size - 5;
    circles = [];
    lastSpawn = 0;
    score = 0;
    gameOver = false;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function checkCollision(circle) {
    // Approximate square as its bounding box
    const sq = {
      left: player.x,
      right: player.x + player.size,
      top: player.y,
      bottom: player.y + player.size,
    };
    const cx = circle.x;
    const cy = circle.y;
    const r = circle.r;
    // Find closest point on square to circle center
    const closestX = Math.max(sq.left, Math.min(cx, sq.right));
    const closestY = Math.max(sq.top, Math.min(cy, sq.bottom));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
  }

  function loop(timestamp) {
    const delta = (timestamp - lastTime) / 16; // normalize to ~60fps steps
    lastTime = timestamp;
    if (gameOver) {
      // Draw game over screen
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
      return;
    }

    // Update player position
    if (player.moveLeft) player.x = Math.max(0, player.x - player.speed);
    if (player.moveRight) player.x = Math.min(width - player.size, player.x + player.speed);

    // Spawn circles
    if (timestamp - lastSpawn > spawnInterval) {
      circles.push(new Circle());
      lastSpawn = timestamp;
    }

    // Update circles & remove off-screen
    circles.forEach(c => c.update(delta));
    circles = circles.filter(c => {
        if (c.y - c.r > height) {
          // Circle passed bottom – increase score and play a short beep
          score++;
          playTone(800, 0.05);
          return false;
        }
        if (checkCollision(c)) {
          // Collision – game over sound
          playTone(200, 0.3);
          gameOver = true;
        }
        return true;
      });

    // Draw everything
    ctx.clearRect(0, 0, width, height);
    // Background with subtle vertical gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Player
    ctx.fillStyle = '#55ff55';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // Circles
    circles.forEach(c => c.draw());
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);

    requestAnimationFrame(loop);
  }

  // Start the game
  reset();
})();
