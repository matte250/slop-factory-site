// Simple Starfall Catcher game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 300;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    draw() {
      // Draw ship as a simple triangle for a more dynamic look
      ctx.fillStyle = '#0af';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  const stars = [];
  let score = 0;
  let gameOver = false;
  let frame = 0;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Ensure audio can play after first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function spawnStar() {
    const size = 10 + Math.random() * 10;
    stars.push({ x: Math.random() * (width - size), y: -size, size, speed: 2 + Math.random() * 3 });
  }

  function update() {
    if (gameOver) return;
    // ship movement
    if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys['ArrowRight']) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      // collision with ship
        if (s.y + s.size >= ship.y && s.x + s.size > ship.x && s.x < ship.x + ship.w) {
          score++;
          // Play catch sound
          beep(660, 0.1);
          stars.splice(i, 1);
          continue;
        }
        // missed star
        if (s.y > height) {
          gameOver = true;
          // Play game over sound
          beep(220, 0.3);
        }
    }

    // spawn rate
    if (frame % 30 === 0) spawnStar();
    frame++;
  }

  function draw() {
    // Background gradient for depth
    const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ship.draw();

    // Draw stars with radial gradient circles
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(
        s.x + s.size / 2,
        s.y + s.size / 2,
        0,
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size / 2
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#ff0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f33';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
