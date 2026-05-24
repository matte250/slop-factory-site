// Game based on IDEA.md – Dodging Squares
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // ----- Audio setup -----
  // Use Web Audio API to generate simple sound effects without external files.
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, duration = 0.1, type = 'sine', volume = 0.2) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Specific sound effects
  function soundScore() { // higher pitch for each point
    playTone(600, 0.05, 'triangle');
  }
  function soundHit() { // low, harsh tone for collision
    playTone(150, 0.3, 'sawtooth');
  }
  function soundGameOver() { // descending glissando
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  // Player configuration
  const player = {
    width: 50,
    height: 20,
    x: canvas.width / 2 - 25,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
    },
    draw() {
      // Draw player with rounded corners and gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#66bb6a');
      grad.addColorStop(1, '#1b5e20');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 6;
      const radius = 5;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.width - radius, this.y);
      ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
      ctx.lineTo(this.x + this.width, this.y + this.height - radius);
      ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
      ctx.lineTo(this.x + radius, this.y + this.height);
      ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
      ctx.lineTo(this.x, this.y + radius);
      ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent';
    }
  };

  // Falling squares configuration
  const squares = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames between spawns, will decrease over time
  let speedMultiplier = 1;

  const score = { value: 0 };
  let gameOverPlayed = false; // ensure game over sound plays once

  let gameOver = false;

  function spawnSquare() {
    const size = 30 + Math.random() * 20; // 30‑50px
    const x = Math.random() * (canvas.width - size);
    const speed = 2 * speedMultiplier + Math.random();
    squares.push({ x, y: -size, size, speed });
  }

  function updateSquares() {
    for (let i = squares.length - 1; i >= 0; i--) {
      const s = squares[i];
      s.y += s.speed;
      // Check for collision with player
      if (
        s.x < player.x + player.width &&
        s.x + s.size > player.x &&
        s.y < player.y + player.height &&
        s.y + s.size > player.y
      ) {
        soundHit();
        gameOver = true;
        return;
      }
      // Remove squares that passed the bottom
    if (s.y > canvas.height) {
      squares.splice(i, 1);
      score.value++;
      soundScore();
      // Gradually increase difficulty
      if (score.value % 5 === 0) {
        speedMultiplier += 0.1;
      }
    }
    }
  }

  function drawSquares() {
    // Draw each falling square with a radial gradient and slight shadow for depth
    squares.forEach(s => {
      const gradient = ctx.createRadialGradient(
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size * 0.1,
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size / 2
      );
      gradient.addColorStop(0, '#ff8a80');
      gradient.addColorStop(1, '#c62828');
      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillRect(s.x, s.y, s.size, s.size);
      // Reset shadow for next drawing
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score.value}`, 10, 20);
  }

  function drawGameOver() {
    // Play game over sound once
    if (!gameOverPlayed) {
      soundGameOver();
      gameOverPlayed = true;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`Final Score: ${score.value}`, canvas.width / 2, canvas.height / 2 + 30);
  }

  function drawBackground() {
    // Vertical gradient from dark navy to midnight blue
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0d1b2a');
    grad.addColorStop(1, '#1b263b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const text = `Score: ${score.value}`;
    ctx.strokeText(text, 10, 20);
    ctx.fillText(text, 10, 20);
  }

  function loop() {
    if (gameOver) {
      drawGameOver();
      return;
    }
    // Draw background first
    drawBackground();

    // Spawn logic
    spawnTimer++;
    if (spawnTimer >= Math.max(30, spawnInterval / speedMultiplier)) {
      spawnSquare();
      spawnTimer = 0;
    }

    player.update();
    updateSquares();
    player.draw();
    drawSquares();
    drawScore();

    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  // Start the game after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
