// Simple Meteor Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  // audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const cw = canvas.width = canvas.offsetWidth;
  const ch = canvas.height = canvas.offsetHeight;

  // ship properties (drawn as a triangle)
  const ship = { w: 40, h: 30, x: cw / 2 - 20, y: ch - 40, speed: 5 };
  // meteors
  const meteors = [];
  const meteorFreq = 800; // ms
  const meteorSpeed = 2;
  // bullets
  const bullets = [];
  const bulletSpeed = 7;

  let left = false, right = false, fire = false, gameOver = false;

  // input
  document.addEventListener('keydown', e => {
  // resume audio context on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowLeft') left = true;
    if (e.code === 'ArrowRight') right = true;
    if (e.code === 'Space') fire = true;
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') left = false;
    if (e.code === 'ArrowRight') right = false;
    if (e.code === 'Space') fire = false;
  });

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (cw - size);
    meteors.push({ x, y: -size, w: size, h: size });
  }
  setInterval(spawnMeteor, meteorFreq);

  function update() {
    if (gameOver) return;
    // ship movement
    if (left) ship.x = Math.max(0, ship.x - ship.speed);
    if (right) ship.x = Math.min(cw - ship.w, ship.x + ship.speed);
    // fire bullet
if (fire) {
          // limit fire rate by simple cooldown
          if (!ship.lastShot || Date.now() - ship.lastShot > 300) {
            // play shooting sound (high pitch)
            playTone(800, 0.05);
            bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10 });
            ship.lastShot = Date.now();
          }
        }
    // update bullets
    bullets.forEach(b => b.y -= bulletSpeed);
    // remove off-screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].y + bullets[i].h < 0) bullets.splice(i, 1);
    }
    // update meteors
    meteors.forEach(m => m.y += meteorSpeed);
    // collision detection
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      // ship hit
      if (m.x < ship.x + ship.w && m.x + m.w > ship.x && m.y < ship.y + ship.h && m.y + m.h > ship.y) {
        // ship hit sound
        playTone(200, 0.3);
        gameOver = true;
        alert('Game Over');
        return;
      }
      // bullet hit
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.x < m.x + m.w && b.x + b.w > m.x && b.y < m.y + m.h && b.y + b.h > m.y) {
          // bullet hit sound
          playTone(600, 0.1);
          bullets.splice(j, 1);
          meteors.splice(i, 1);
          break;
        }
      }
      // meteor reaches bottom
      if (m.y > ch) {
        // meteor hit bottom sound
        playTone(200, 0.3);
        gameOver = true;
        alert('Game Over');
        return;
      }
    }
  }

  function draw() {
    // background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);
    // draw stars
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = 'white';
      const sx = Math.random() * cw;
      const sy = Math.random() * ch;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // ship (triangle)
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // bullets (small circles)
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w, 0, Math.PI * 2);
      ctx.fill();
    });
    // meteors (circles with gradient)
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, m.w / 4, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
