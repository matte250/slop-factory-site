// Simple Meteor Dodge game
// Canvas with id="game" expected in HTML
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;

  const ship = { w: 40, h: 20, x: w / 2 - 20, y: h - 30, speed: 5 };
  const keys = {};
  let lives = 3;
  let score = 0;
  const meteors = [];
  const lasers = [];
  const meteorFreq = 90; // frames
  let frame = 0;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Input
  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  function spawnMeteor() {
    const size = 20 + Math.random() * 30;
    meteors.push({ x: Math.random() * (w - size), y: -size, size, speed: 2 + Math.random() * 2 });
  }

  function update() {
    // Ship movement
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x));

    // Shooting
    if (keys[' '] && frame % 15 === 0) {
      lasers.push({ x: ship.x + ship.w / 2, y: ship.y, speed: 7 });
      playBeep(800, 0.05);
    }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y < 0) lasers.splice(i, 1);
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Collision with ship
      if (
        m.x < ship.x + ship.w && m.x + m.size > ship.x &&
        m.y < ship.y + ship.h && m.y + m.size > ship.y
      ) {
        meteors.splice(i, 1);
        lives--;
        playBeep(300, 0.2); // ship hit sound
        continue;
      }
      // Collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (
          l.x > m.x && l.x < m.x + m.size &&
          l.y > m.y && l.y < m.y + m.size
        ) {
          meteors.splice(i, 1);
          lasers.splice(j, 1);
          score++;
          break;
        }
      }
      // Off‑screen
      if (m.y > h) {
        meteors.splice(i, 1);
        lives--;
      }
    }

    // Spawn meteors
    if (frame % meteorFreq === 0) spawnMeteor();
    frame++;
  }

  function draw() {
    // Background: dark space with subtle stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    // draw stars (generated once)
    if (!window._stars) {
      window._stars = [];
      for (let i = 0; i < 100; i++) {
        window._stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 });
      }
    }
    ctx.fillStyle = '#fff';
    window._stars.forEach(st => ctx.fillRect(st.x, st.y, st.r, st.r));

    // Ship – draw as a sleek triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Lasers – glowing yellow lines
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x, l.y - 10);
      ctx.stroke();
    });
    ctx.shadowBlur = 0; // reset

    // Meteors – draw with radial gradient for depth
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2, m.y + m.size / 2, m.size * 0.1,
        m.x + m.size / 2, m.y + m.size / 2, m.size / 2
      );
      grad.addColorStop(0, '#f55');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${lives}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
  }

  function loop() {
    if (lives <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', w / 2 - 80, h / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
