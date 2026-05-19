// Game implementation for canvas with id="game"
// Simple Asteroid Harvest game based on IDEA.md

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollectSound() { playTone(800, 0.1); }
  function playCrashSound() { playTone(200, 0.4); }

  // Starfield background
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
  }

  // Ship (triangle shape)
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.width, this.x + this.speed);
    },
  };

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() {
    const isGold = Math.random() < 0.3; // 30% gold
    asteroids.push({
      x: rand(0, width),
      y: -20,
      radius: 12,
      speed: rand(1.5, 3),
      gold: isGold,
    });
  }

  // Draw asteroid with radial gradient for depth
  function drawAsteroid(a) {
    const gradient = ctx.createRadialGradient(
      a.x,
      a.y,
      a.radius * 0.2,
      a.x,
      a.y,
      a.radius
    );
    if (a.gold) {
      gradient.addColorStop(0, '#fff700'); // bright center
      gradient.addColorStop(1, '#ffb300'); // outer gold
    } else {
      gradient.addColorStop(0, '#bbbbbb');
      gradient.addColorStop(1, '#555555');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      if (
        a.x + a.radius > ship.x &&
        a.x - a.radius < ship.x + ship.width &&
        a.y + a.radius > ship.y &&
        a.y - a.radius < ship.y + ship.height
      ) {
        if (a.gold) {
          score++;
          asteroids.splice(i, 1);
          playCollectSound();
        } else {
          gameOver = true;
          playCrashSound();
        }
      }
    }
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2 - 70, height / 2 + 30);
      return;
    }
    // Draw background starfield
    drawStars();
    ship.update();
    ship.draw();
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }
    updateAsteroids();
    asteroids.forEach(drawAsteroid);
    drawScore();
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  // Start game when page ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
