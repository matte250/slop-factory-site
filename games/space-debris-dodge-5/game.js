// Space Debris Dodge game
// Canvas element with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ----- Audio Setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  };

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCollision = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ----- Starfield -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), size: rand(0.5, 2), speed: rand(0.2, 0.8) });
  }
  const updateStars = () => {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = rand(0, width); }
    }
  };
  const drawStars = () => {
    // Fill background with a dark gradient for depth
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw twinkling stars as circles with varying opacity
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${rand(0.5, 1)})`;
      ctx.fill();
    }
  };

  // ----- Player ship -----
  const ship = {
    w: 30,
    h: 40,
    x: width / 2 - 15,
    y: height - 60,
    speedX: 0,
    speedY: 0,
    color: '#0f0',
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      // Keep within bounds
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > width) this.x = width - this.w;
      if (this.y < 0) this.y = 0;
      if (this.y + this.h > height) this.y = height - this.h;
    },
    draw() {
      // Ship with a subtle gradient and slight glow
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#8f8');
      grad.addColorStop(1, '#0f0');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0,255,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  };

  // ----- Debris -----
  const debris = [];
  // Debris will have a rotation angle for visual variety
  const maxAngle = Math.PI * 2;
  const spawnDebris = () => {
    const size = rand(20, 50);
    debris.push({
      x: rand(0, width - size),
      y: -size,
      w: size,
      h: size,
      speed: rand(2, 5),
      // random rotation angle and speed for each piece
      angle: rand(0, maxAngle),
      angularSpeed: rand(-0.05, 0.05),
      color: `hsl(${rand(0, 360)},70%,55%)` // varied color
    });
  };
  const updateDebris = () => {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed;
      d.angle += d.angularSpeed;
      if (d.y > height) debris.splice(i, 1);
    }
    // occasional spawn
    if (Math.random() < 0.02) spawnDebris();
  };
  const drawDebris = () => {
    for (const d of debris) {
      ctx.save();
      ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
      ctx.rotate(d.angle);
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  let boostActive = false;
  const handleInput = () => {
    // Ensure audio context is running after first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    ship.speedX = 0;
    ship.speedY = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.speedX = -4;
    if (keys['ArrowRight'] || keys['d']) ship.speedX = 4;
    if (keys['ArrowUp'] || keys['w'] || keys[' ']) {
      ship.speedY = -6; // boost upward
      if (!boostActive) {
        boostActive = true;
        playTone(600, 100); // boost sound
      }
    } else {
      boostActive = false;
    }
  };

  // ----- Score -----
  let score = 0;
  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
  };

  // ----- Game Loop -----
  let gameOver = false;
  const loop = () => {
    if (gameOver) {
      // Play crash sound once
      if (!gameOver.soundPlayed) {
        playTone(200, 300);
        gameOver.soundPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', width / 2 - 100, height / 2);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    updateStars();
    drawStars();
    handleInput();
    ship.update();
    ship.draw();
    updateDebris();
    drawDebris();
    // collision check
    for (const d of debris) {
      if (rectCollision(ship, d)) { gameOver = true; break; }
    }
    // simple score increase over time
    score += 0.1;
    drawScore();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
