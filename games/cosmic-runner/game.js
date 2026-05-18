// Minimal Cosmic Runner game
// Assumes <canvas id="game"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Game state
  let ship = { x: 50, y: canvas.height / 2, w: 20, h: 15 };
  const obstacles = [];
  const stars = [];
  let score = 0;
  let speed = 2; // base obstacle speed
  let frame = 0;
  let running = true;

  // Audio setup
  let audioCtx;
  let bgOsc;
  let bgGain;
  function startAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    bgOsc = audioCtx.createOscillator();
    bgGain = audioCtx.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 30; // low hum
    bgGain.gain.value = 0.04;
    bgOsc.connect(bgGain).connect(audioCtx.destination);
    bgOsc.start();
  }
  function playExplosion() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  // Initialize star field
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  });

  function update() {
    // ship movement (arrow keys)
    if (keys.ArrowUp) ship.y -= 4;
    if (keys.ArrowDown) ship.y += 4;
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // star field movement (parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= speed / 2; // slower than obstacles
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }

    // spawn obstacles
    if (frame % Math.max(60 - speed * 5, 20) === 0) {
      const size = 15 + Math.random() * 15;
      obstacles.push({ x: canvas.width, y: Math.random() * (canvas.height - size), w: size, h: size, speed: speed + Math.random() });
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
        // increase difficulty gradually
        if (score % 10 === 0) speed += 0.5;
      }
    }

    // collision detection
    for (const o of obstacles) {
      if (ship.x < o.x + o.w && ship.x + ship.w > o.x && ship.y < o.y + o.h && ship.y + ship.h > o.y) {
        running = false;
        playExplosion();
        break;
      }
    }

    frame++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#06c');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // obstacles with subtle shading
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start
  startAudio();
  requestAnimationFrame(loop);
})();
