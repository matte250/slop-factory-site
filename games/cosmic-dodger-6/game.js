// Minimal side‑scroll game for canvas #game
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration + 0.02);
  }

  // background hum (low freq)
  let humInterval = setInterval(() => playTone(30, 0.2), 2000);

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // player ship
  const ship = { x: 50, y: H / 2, w: 30, h: 15, dy: 0 };
  // obstacles and stars
  const asteroids = [];
  const stars = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // input
  const keys = {};
  addEventListener('keydown', e => { keys[e.key] = true; });
  addEventListener('keyup', e => { keys[e.key] = false; });
  // resume audio on first user interaction
  addEventListener('click', () => audioCtx.resume());

  function spawn() {
    if (frame % 90 === 0) { // asteroid approx every 1.5s @60fps
      const h = 20 + Math.random() * 30;
      asteroids.push({ x: W, y: Math.random() * (H - h), w: 20, h, speed: 2 + Math.random() * 3 });
    }
    if (frame % 150 === 0) { // star less frequent
      const size = 5;
      stars.push({ x: W, y: Math.random() * (H - size), size, speed: 2 });
    }
  }

  function update() {
    // move ship
    ship.dy = 0;
    if (keys.ArrowUp) ship.dy = -4;
    if (keys.ArrowDown) ship.dy = 4;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y + ship.dy));

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }
    // move stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x + s.size < 0) stars.splice(i, 1);
    }
    // collisions
    for (const a of asteroids) {
      if (ship.x < a.x + a.w && ship.x + ship.w > a.x &&
          ship.y < a.y + a.h && ship.y + ship.h > a.y) {
        playTone(200, 0.2); // collision beep
      gameOver = true;
        break;
      }
    }
    // collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (ship.x < s.x + s.size && ship.x + ship.w > s.x &&
          ship.y < s.y + s.size && ship.y + ship.h > s.y) {
        playTone(400, 0.1); // star collect beep
        score++;
        stars.splice(i, 1);
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // parallax background stars (tiny)
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 50; i++) {
      const sx = (frame * 0.3 + i * 17) % W;
      const sy = (i * 53) % H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // draw ship as a triangle with gradient
    ctx.save();
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw asteroids as circles with radial gradient
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w / 4, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      radGrad.addColorStop(0, '#b5651d');
      radGrad.addColorStop(1, '#331');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw stars as glowing circles
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(s.x + s.size / 2, s.y + s.size / 2, 0, s.x + s.size / 2, s.y + s.size / 2, s.size);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // score with shadow
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText('Score: ' + score, 10, 24);
    ctx.shadowBlur = 0;

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.textAlign = 'start';
    }
  }

  function loop() {
    if (gameOver) { draw(); return; }
    spawn();
    update();
    draw();
    frame++;
    requestAnimationFrame(loop);
  }
  loop();
})();
